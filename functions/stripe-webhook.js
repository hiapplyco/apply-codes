const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get configuration from environment
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';
const stripe = stripeApiKey !== 'sk_test_placeholder'
  ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' })
  : null;

// Get Firestore database instance
const db = admin.firestore();

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  console.log('Stripe webhook received:', req.method);

  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    console.error('Missing stripe-signature header');
    res.status(400).send('Missing signature');
    return;
  }

  if (!stripe || stripeApiKey === 'sk_test_placeholder') {
    console.error('Missing STRIPE_SECRET_KEY');
    res.status(500).send('Server configuration error');
    return;
  }

  let event;
  try {
    // Construct the event using Stripe's webhook signature verification
    event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      signature,
      stripeWebhookSecret
    );
    console.log('Webhook verified for event:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Process the event
  try {
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object;
        console.log('Customer created:', customer.id);

        if (customer.metadata?.user_id) {
          // Update subscription in Firestore
          const docRef = db.collection('user_subscription_details').doc(customer.metadata.user_id);
          await docRef.set({
            stripeCustomerId: customer.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        if (session.subscription && session.customer && session.metadata?.user_id) {
          // Retrieve the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const tier = mapPriceIdToTier(subscription.items.data[0].price.id);
          const limits = getLimitsForTier(tier);

          // Update subscription in Firestore
          const docRef = db.collection('user_subscription_details').doc(session.metadata.user_id);
          await docRef.set({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: 'active',
            tier: tier,
            ...limits, // Spread limits into the document
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);

        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(subscription.customer);

        if (customer.metadata?.user_id) {
          const tier = mapPriceIdToTier(subscription.items.data[0].price.id);
          const limits = getLimitsForTier(tier);
          const status = mapStripeStatusToDb(subscription.status);

          // Update subscription in Firestore
          const docRef = db.collection('user_subscription_details').doc(customer.metadata.user_id);
          await docRef.set({
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: status,
            tier: tier,
            ...limits, // Spread limits into the document
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(subscription.customer);

        if (customer.metadata?.user_id) {
          // Update subscription in Firestore
          const docRef = db.collection('user_subscription_details').doc(customer.metadata.user_id);
          await docRef.update({
            status: 'expired',
            canceledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('Invoice paid:', invoice.id);

        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(invoice.customer);

        if (customer.metadata?.user_id) {
          // Record payment in billing history
          await db.collection('billingHistory').add({
            userId: customer.metadata.user_id,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            stripeChargeId: invoice.charge,
            amountPaid: invoice.amount_paid,
            currency: invoice.currency,
            description: invoice.description || 'Subscription payment',
            status: 'paid',
            paidAt: new Date(invoice.status_transitions.paid_at * 1000),
            invoicePdfUrl: invoice.invoice_pdf,
            receiptUrl: invoice.receipt_number,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Invoice payment failed:', invoice.id);

        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(invoice.customer);

        if (customer.metadata?.user_id) {
          // Update subscription status
          const docRef = db.collection('user_subscription_details').doc(customer.metadata.user_id);
          await docRef.update({
            status: 'past_due',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Record failed payment
          await db.collection('billingHistory').add({
            userId: customer.metadata.user_id,
            stripeInvoiceId: invoice.id,
            amountPaid: 0,
            currency: invoice.currency,
            description: 'Failed payment attempt',
            status: 'failed',
            failureReason: 'Payment failed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

// Helper function to map Stripe status to our database enum
function mapStripeStatusToDb(stripeStatus) {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    default:
      return 'expired';
  }
}

// Helper function to map price IDs to subscription tiers
function mapPriceIdToTier(priceId) {
  // These will need to be updated with actual Stripe price IDs
  const priceMap = {
    'price_starter_monthly': 'starter',
    'price_starter_yearly': 'starter',
    'price_professional_monthly': 'professional',
    'price_professional_yearly': 'professional',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  };

  return priceMap[priceId] || 'starter';
}

// Helper function to get limits for a tier
function getLimitsForTier(tier) {
  const limits = {
    free_trial: {
      searchesLimit: 10,
      candidatesEnrichedLimit: 50,
      aiCallsLimit: 100,
      videoInterviewsLimit: 5,
      projectsLimit: 3,
      teamMembersLimit: 1,
    },
    starter: {
      searchesLimit: 100,
      candidatesEnrichedLimit: 200,
      aiCallsLimit: 500,
      videoInterviewsLimit: 20,
      projectsLimit: 10,
      teamMembersLimit: 3,
    },
    professional: {
      searchesLimit: 500,
      candidatesEnrichedLimit: 1000,
      aiCallsLimit: 2000,
      videoInterviewsLimit: 100,
      projectsLimit: 50,
      teamMembersLimit: 10,
    },
    enterprise: {
      searchesLimit: null, // Unlimited
      candidatesEnrichedLimit: null,
      aiCallsLimit: null,
      videoInterviewsLimit: null,
      projectsLimit: null,
      teamMembersLimit: null,
    }
  };

  return limits[tier] || limits.starter;
}