import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia' as any,
});

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  credits: number;
  bonusCredits: number;
  priceInCents: number;
  stripeCustomerId?: string;
}

/**
 * Create a Stripe Checkout Session for credit purchases.
 * Returns the session object with its URL for redirect.
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    userId,
    userEmail,
    packageId,
    packageName,
    credits,
    bonusCredits,
    priceInCents,
    stripeCustomerId,
  } = params;

  const totalCredits = credits + bonusCredits;
  const description = bonusCredits > 0
    ? `${credits} Credits + ${bonusCredits} Bonus Credits (${totalCredits} total)`
    : `${credits} Credits`;

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: stripeCustomerId ? undefined : userEmail,
    customer: stripeCustomerId || undefined,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: packageName,
            description,
            metadata: {
              packageId,
              credits: String(credits),
              bonusCredits: String(bonusCredits),
            },
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
      credits: String(credits),
      bonusCredits: String(bonusCredits),
      totalCredits: String(totalCredits),
    },
    success_url: `${APP_URL}/credits?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url: `${APP_URL}/credits?status=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  };

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session;
}

/**
 * Verify a Stripe webhook signature and construct the event.
 * Used in the webhook endpoint to validate incoming events from Stripe.
 */
export function verifyWebhookSignature(
  payload: Buffer | string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve a Checkout Session by ID with expanded line items.
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

/**
 * Create or retrieve a Stripe Customer for a user.
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string,
  existingCustomerId?: string
): Promise<Stripe.Customer> {
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch {
      // Customer not found, create a new one
    }
  }

  return stripe.customers.create({
    email,
    name: name || undefined,
  });
}

/**
 * Issue a refund for a payment intent.
 */
export async function createRefund(
  paymentIntentId: string,
  amountInCents?: number
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amountInCents) {
    refundParams.amount = amountInCents;
  }

  return stripe.refunds.create(refundParams);
}

/**
 * List recent payment intents for a customer.
 */
export async function listCustomerPayments(
  customerId: string,
  limit: number = 10
): Promise<Stripe.ApiList<Stripe.PaymentIntent>> {
  return stripe.paymentIntents.list({
    customer: customerId,
    limit,
  });
}

export { stripe };

export default {
  stripe,
  createCheckoutSession,
  verifyWebhookSignature,
  getCheckoutSession,
  getOrCreateCustomer,
  createRefund,
  listCustomerPayments,
};
