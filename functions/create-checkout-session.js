const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get Stripe API key from environment
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = stripeApiKey !== 'sk_test_placeholder'
  ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' })
  : null;

// Get Firestore database instance
const db = admin.firestore();

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  console.log('Creating checkout session with data:', {
    priceId: data.priceId,
    hasSuccessUrl: !!data.successUrl,
    hasCancelUrl: !!data.cancelUrl,
    userId: context.auth?.uid
  });

  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create checkout session'
    );
  }

  const { priceId, successUrl, cancelUrl } = data;

  if (!priceId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Price ID is required'
    );
  }

  if (!stripe || stripeApiKey === 'sk_test_placeholder') {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Stripe configuration error'
    );
  }

  try {
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    // Get or create Stripe customer
    let customerId;

    // First, try to get existing customer from Firestore
    try {
      const docRef = db.collection('user_subscription_details').doc(userId);
      const doc = await docRef.get();

      if (doc.exists) {
        const subscription = doc.data();
        if (subscription.stripeCustomerId) {
          customerId = subscription.stripeCustomerId;
          console.log('Found existing Stripe customer:', customerId);
        }
      }
    } catch (dbError) {
      console.error('Error fetching from Firestore:', dbError);
    }

    // If no customer found, create a new one
    if (!customerId) {
      console.log('Creating new Stripe customer for:', userEmail);
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
          source: 'firebase_function'
        }
      });
      customerId = customer.id;
      console.log('Created new Stripe customer:', customerId);

      // Try to update Firestore with the new customer ID
      try {
        const docRef = db.collection('user_subscription_details').doc(userId);

        // Use set with merge: true to create if not exists or update if exists
        await docRef.set({
          userId: userId,
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      } catch (dbError) {
        console.error('Error updating Firestore:', dbError);
        // Continue anyway - Stripe is more important
      }
    }

    // Validate price ID against allowed prices
    const validPriceIds = [
      'price_1SZkXQC3HTLX6YIcgrBDgC3m',  // Pro Monthly $149
      'price_1SZkYCC3HTLX6YIcjIPoUdMi',  // Pro Yearly $1,788
      // Add enterprise price IDs when created
    ];

    if (!validPriceIds.includes(priceId)) {
      console.warn('Unknown price ID:', priceId, '- proceeding anyway');
    }

    // Create checkout session
    // Note: No trial_period_days since users already get 7-day free trial before upgrading
    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || 'https://applycodes-2683f.web.app/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl || 'https://applycodes-2683f.web.app/pricing?canceled=true',
      metadata: {
        user_id: userId,
        source: 'firebase_function'
      },
      subscription_data: {
        metadata: {
          user_id: userId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto'
      }
    });

    console.log('Checkout session created:', session.id);

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Card error: ${error.message}`
      );
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid request: ${error.message}`
      );
    } else if (error.type === 'StripeAPIError') {
      throw new functions.https.HttpsError(
        'unavailable',
        'Stripe service temporarily unavailable'
      );
    }

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create checkout session'
    );
  }
});