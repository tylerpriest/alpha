import Stripe from 'stripe';
import { db } from './db';
import { SubscriptionTier } from '@prisma/client';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 299,
    priceId: process.env.STRIPE_PRICE_STARTER,
    features: [
      '5 team members',
      '10GB storage',
      '1,000 AI queries/month',
      'Email support',
    ],
    limits: {
      members: 5,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
      queries: 1000,
    },
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 799,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
    features: [
      '25 team members',
      '100GB storage',
      '10,000 AI queries/month',
      'Priority support',
      'API access',
      'Custom integrations',
    ],
    limits: {
      members: 25,
      storage: 100 * 1024 * 1024 * 1024, // 100GB
      queries: 10000,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null, // Custom pricing
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: [
      'Unlimited team members',
      'Unlimited storage',
      'Unlimited AI queries',
      'Dedicated support',
      'Custom integrations',
      'SSO/SAML',
      'SLA',
    ],
    limits: {
      members: Infinity,
      storage: Infinity,
      queries: Infinity,
    },
  },
};

export async function createCheckoutSession(
  organizationId: string,
  tier: 'STARTER' | 'PROFESSIONAL',
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  const plan = PLANS[tier];
  if (!plan.priceId) {
    throw new Error('Price ID not configured');
  }

  let customerId = org.stripeCustomerId;

  // Create customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: {
        organizationId,
      },
    });

    await db.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customer.id },
    });

    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
      tier,
    },
  });

  return session;
}

export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org?.stripeCustomerId) {
    throw new Error('No billing information found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!org) {
    console.error(`No organization found for customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;

  // Determine tier based on price ID
  let tier: SubscriptionTier = 'FREE';
  if (priceId === PLANS.STARTER.priceId) tier = 'STARTER';
  else if (priceId === PLANS.PROFESSIONAL.priceId) tier = 'PROFESSIONAL';
  else if (priceId === PLANS.ENTERPRISE.priceId) tier = 'ENTERPRISE';

  // Update organization
  await db.organization.update({
    where: { id: org.id },
    data: {
      subscriptionTier: tier,
      subscriptionId: subscription.id,
      subscriptionEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      // Update limits based on tier
      queryLimit: PLANS[tier]?.limits?.queries || 1000,
      storageLimit: BigInt(PLANS[tier]?.limits?.storage || 1073741824),
    },
  });

  // Log activity
  await db.activity.create({
    data: {
      type: 'SETTINGS_CHANGED',
      description: `Subscription updated to ${tier}`,
      organizationId: org.id,
    },
  });
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  const org = await db.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!org) {
    console.error(`No organization found for customer ${customerId}`);
    return;
  }

  // Downgrade to free tier
  await db.organization.update({
    where: { id: org.id },
    data: {
      subscriptionTier: 'FREE',
      subscriptionId: null,
      subscriptionEnd: null,
      queryLimit: 100,
      storageLimit: BigInt(1073741824), // 1GB
    },
  });

  // Log activity
  await db.activity.create({
    data: {
      type: 'SETTINGS_CHANGED',
      description: 'Subscription cancelled, downgraded to Free tier',
      organizationId: org.id,
    },
  });
}
