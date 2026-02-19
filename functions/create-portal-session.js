const functions = require('firebase-functions');
const { logger } = require("firebase-functions/v2");
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

exports.createPortalSession = functions.https.onCall(async (data, context) => {
    logger.info('Creating portal session with data:', {
        returnUrl: data.returnUrl,
        userId: context.auth?.uid
    });

    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be authenticated to create portal session'
        );
    }

    const { returnUrl } = data;

    if (!stripe || stripeApiKey === 'sk_test_placeholder') {
        logger.error('Missing STRIPE_SECRET_KEY environment variable');
        throw new functions.https.HttpsError(
            'failed-precondition',
            'Stripe configuration error'
        );
    }

    try {
        const userId = context.auth.uid;
        let customerId;

        // Get existing customer from Firestore
        try {
            const docRef = db.collection('user_subscription_details').doc(userId);
            const doc = await docRef.get();

            if (doc.exists) {
                const subscription = doc.data();
                if (subscription.stripeCustomerId) {
                    customerId = subscription.stripeCustomerId;
                    logger.info('Found existing Stripe customer:', customerId);
                }
            }
        } catch (dbError) {
            logger.error('Error fetching from Firestore:', dbError);
        }

        if (!customerId) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'No Stripe customer found for this user'
            );
        }

        // Create portal session
        logger.info('Creating Stripe portal session...');
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || 'https://apply.codes/account',
        });

        logger.info('Portal session created:', session.id);

        return {
            success: true,
            url: session.url
        };

    } catch (error) {
        logger.error('Error creating portal session:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Failed to create portal session'
        );
    }
});
