import type Stripe from "stripe";
import { toE164Phone } from "@/lib/phone";
import {
  isAllowedShippingCountry,
  STRIPE_ALLOWED_COUNTRY_CODES,
} from "@/lib/shipping";
import type { CheckoutAddress } from "@/types/checkout";

export type CheckoutMemberAddress = {
  address_id: number;
  recipient_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  is_default: boolean;
};

export type CheckoutMember = {
  user_id: number;
  first_name: string;
  last_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  default_address: CheckoutMemberAddress | null;
};

function buildStripeAddressFromMember(user: CheckoutMember): Stripe.AddressParam | null {
  const address = user.default_address;
  if (!address) return null;

  const country = isAllowedShippingCountry(address.country)
    ? address.country
    : "HK";

  if (!address.street_address && !address.city) {
    return { country };
  }

  const stripeAddress: Stripe.AddressParam = {
    line1: address.street_address || undefined,
    country,
    postal_code: address.postal_code || undefined,
  };

  if (address.city) {
    if (country === "HK") {
      stripeAddress.state = address.city;
    } else {
      stripeAddress.city = address.city;
    }
  }

  return stripeAddress;
}

export function buildStripeAddressFromCheckout(
  address: CheckoutAddress,
): Stripe.AddressParam {
  const country = isAllowedShippingCountry(address.country)
    ? address.country
    : "HK";

  const stripeAddress: Stripe.AddressParam = {
    line1: address.address1,
    line2: address.address2 || undefined,
    country,
    postal_code: address.postalCode || undefined,
  };

  if (address.city) {
    if (country === "HK") {
      stripeAddress.state = address.city;
    } else {
      stripeAddress.city = address.city;
    }
  }

  return stripeAddress;
}

export async function createGuestStripeCustomer(
  stripe: Stripe,
  billing: CheckoutAddress,
  shipping: CheckoutAddress,
) {
  const billingAddress = buildStripeAddressFromCheckout(billing);
  const shippingAddress = buildStripeAddressFromCheckout(shipping);
  const stripePhone = toE164Phone(billing.phone, billing.country);
  const fullName = `${billing.firstName} ${billing.lastName}`.trim();

  return stripe.customers.create({
    email: billing.email.trim().toLowerCase(),
    name: fullName || undefined,
    ...(stripePhone ? { phone: stripePhone } : {}),
    address: billingAddress,
    shipping: {
      name: fullName || billing.email,
      ...(stripePhone ? { phone: stripePhone } : {}),
      address: shippingAddress,
    },
  });
}

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  user: CheckoutMember,
) {
  const address = buildStripeAddressFromMember(user);
  const stripePhone = toE164Phone(user.phone, user.default_address?.country);

  const params: Stripe.CustomerUpdateParams = {
    email: user.email,
    name: user.name,
    ...(stripePhone ? { phone: stripePhone } : {}),
    address,
    shipping: {
      name: user.name,
      ...(stripePhone ? { phone: stripePhone } : {}),
      address: address ?? { country: "HK" },
    },
  };

  const existing = await stripe.customers.list({
    email: user.email,
    limit: 1,
  });

  if (existing.data[0]) {
    return stripe.customers.update(existing.data[0].id, params);
  }

  return stripe.customers.create(params as Stripe.CustomerCreateParams);
}

export async function updateStripeCustomerFromCheckout(
  stripe: Stripe,
  customerId: string,
  user: CheckoutMember,
  billing: CheckoutAddress,
  shipping: CheckoutAddress,
) {
  const billingAddress = buildStripeAddressFromCheckout(billing);
  const shippingAddress = buildStripeAddressFromCheckout(shipping);
  const stripePhone = toE164Phone(billing.phone, billing.country);
  const fullName = `${billing.firstName} ${billing.lastName}`.trim();

  return stripe.customers.update(customerId, {
    name: fullName || user.name,
    ...(stripePhone ? { phone: stripePhone } : {}),
    address: billingAddress,
    shipping: {
      name: fullName || user.name,
      ...(stripePhone ? { phone: stripePhone } : {}),
      address: shippingAddress,
    },
  });
}

export { STRIPE_ALLOWED_COUNTRY_CODES };
