export type MemberTab =
  | "dashboard"
  | "account"
  | "password"
  | "addresses"
  | "orders"
  | "favorites";

export const MEMBER_NAV_ITEMS: { id: MemberTab; label: string }[] = [
  { id: "dashboard", label: "會員中心" },
  { id: "account", label: "我的帳號" },
  { id: "password", label: "修改密碼" },
  { id: "addresses", label: "我的地址簿" },
  { id: "orders", label: "我的訂單" },
  { id: "favorites", label: "我的最愛" },
];

export const MEMBER_TAB_TITLES: Record<MemberTab, string> = {
  dashboard: "會員中心",
  account: "我的帳號",
  password: "修改密碼",
  addresses: "我的地址簿",
  orders: "我的訂單",
  favorites: "我的最愛",
};
