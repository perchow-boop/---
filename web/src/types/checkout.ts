export type CheckoutLineItem = {
  id: string;
  quantity: number;
};

export type CheckoutShippingMethod = "delivery" | "pickup";

export type CheckoutAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postalCode?: string;
  address1: string;
  address2?: string;
};

export type CheckoutRequest = {
  items: CheckoutLineItem[];
  billing: CheckoutAddress;
  shippingSameAsBilling: boolean;
  shipping?: CheckoutAddress;
  shippingMethod: CheckoutShippingMethod;
  orderNotes?: string;
};
