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
        const subscriptionsRef = db.collection('subscriptions');
        const snapshot = await subscriptionsRef.where('userId', '==', userId).get();

        if (!snapshot.empty) {
          const subscription = snapshot.docs[0].data();
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
          const subscriptionsRef = db.collection('subscriptions');
          const snapshot = await subscriptionsRef.where('userId', '==', userId).get();

          if (!snapshot.empty) {
            // Update existing record
            const doc = snapshot.docs[0];
            await doc.ref.update({
              stripeCustomerId: customerId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Create new subscription record
            await subscriptionsRef.add({
              userId: userId,
              stripeCustomerId: customerId,
              status: 'pending',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (dbError) {
          console.error('Error updating Firestore:', dbError);
          // Continue anyway - Stripe is more important
        }
      }

      // Create checkout session
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
        success_url: successUrl || 'https://apply.codes/dashboard?success=true',
        cancel_url: cancelUrl || 'https://apply.codes/pricing?canceled=true',
        metadata: {
          user_id: userId,
          source: 'firebase_function'
        },
        subscription_data: {
          trial_period_days: 21,
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