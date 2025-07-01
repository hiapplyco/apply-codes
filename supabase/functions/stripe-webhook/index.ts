import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        
        // Update user with Stripe customer ID
        if (customer.metadata.user_id) {
          await supabase
            .from('subscriptions')
            .update({ stripe_customer_id: customer.id })
            .eq('user_id', customer.metadata.user_id);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.subscription && session.customer && session.metadata?.user_id) {
          // Retrieve the subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Update subscription in database
          await supabase
            .from('subscriptions')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0].price.id,
              status: 'active',
              tier: mapPriceIdToTier(subscription.items.data[0].price.id),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', session.metadata.user_id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (customer.metadata.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0].price.id,
              status: mapStripeStatusToDb(subscription.status),
              tier: mapPriceIdToTier(subscription.items.data[0].price.id),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            })
            .eq('user_id', customer.metadata.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (customer.metadata.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              canceled_at: new Date().toISOString(),
            })
            .eq('user_id', customer.metadata.user_id);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        
        if (customer.metadata.user_id) {
          // Record payment in billing history
          await supabase
            .from('billing_history')
            .insert({
              user_id: customer.metadata.user_id,
              stripe_invoice_id: invoice.id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              stripe_charge_id: invoice.charge as string,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              description: invoice.description || 'Subscription payment',
              status: 'paid',
              paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
              invoice_pdf_url: invoice.invoice_pdf,
              receipt_url: invoice.receipt_number,
            });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Get user_id from customer metadata
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        
        if (customer.metadata.user_id) {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', customer.metadata.user_id);
          
          // Record failed payment
          await supabase
            .from('billing_history')
            .insert({
              user_id: customer.metadata.user_id,
              stripe_invoice_id: invoice.id,
              amount_paid: 0,
              currency: invoice.currency,
              description: 'Failed payment attempt',
              status: 'failed',
              failure_reason: 'Payment failed',
            });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Helper function to map Stripe status to our database enum
function mapStripeStatusToDb(stripeStatus: Stripe.Subscription.Status): string {
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
function mapPriceIdToTier(priceId: string): string {
  // These will need to be updated with your actual Stripe price IDs
  const priceMap: Record<string, string> = {
    'price_starter_monthly': 'starter',
    'price_starter_yearly': 'starter',
    'price_professional_monthly': 'professional',
    'price_professional_yearly': 'professional',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  };
  
  return priceMap[priceId] || 'starter';
}