export const STRIPE_SHIPPING_COUNTRIES = [
  { code: "HK", label: "香港" },
  { code: "TW", label: "台灣" },
  { code: "MO", label: "澳門" },
] as const;

export type ShippingCountryCode =
  (typeof STRIPE_SHIPPING_COUNTRIES)[number]["code"];

export const STRIPE_ALLOWED_COUNTRY_CODES = STRIPE_SHIPPING_COUNTRIES.map(
  (item) => item.code,
);

export function isAllowedShippingCountry(
  value: string | null | undefined,
): value is ShippingCountryCode {
  return (
    value === "HK" || value === "TW" || value === "MO"
  );
}

export function getShippingCountryLabel(code: string | null | undefined) {
  return (
    STRIPE_SHIPPING_COUNTRIES.find((item) => item.code === code)?.label ?? code
  );
}

/** Stripe Checkout 香港「地區」下拉選項（對應 address.state） */
export const HK_STRIPE_DISTRICTS = [
  "中西區",
  "灣仔區",
  "東區",
  "南區",
  "油尖旺區",
  "深水埗區",
  "九龍城區",
  "黃大仙區",
  "觀塘區",
  "荃灣區",
  "屯門區",
  "元朗區",
  "北區",
  "大埔區",
  "沙田區",
  "西貢區",
  "葵青區",
  "離島區",
] as const;

/** 台灣常見縣市（Stripe city） */
export const TW_STRIPE_CITIES = [
  "台北市",
  "新北市",
  "桃園市",
  "台中市",
  "台南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "嘉義市",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義縣",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

/** 澳門堂區（Stripe city） */
export const MO_STRIPE_DISTRICTS = [
  "澳門半島",
  "氹仔",
  "路環",
] as const;

export function getDistrictOptions(country: string | null | undefined) {
  if (country === "TW") {
    return TW_STRIPE_CITIES.map((value) => ({ value, label: value }));
  }

  if (country === "MO") {
    return MO_STRIPE_DISTRICTS.map((value) => ({ value, label: value }));
  }

  return HK_STRIPE_DISTRICTS.map((value) => ({ value, label: value }));
}

export type CheckoutShippingMethod = "delivery" | "pickup";

export const CHECKOUT_SHIPPING_OPTIONS: {
  id: CheckoutShippingMethod;
  label: string;
  fee: number;
}[] = [
  { id: "delivery", label: "香港地區運費", fee: 30 },
  { id: "pickup", label: "店鋪自取", fee: 0 },
];

export function getShippingFee(method: CheckoutShippingMethod) {
  return (
    CHECKOUT_SHIPPING_OPTIONS.find((option) => option.id === method)?.fee ?? 0
  );
}
