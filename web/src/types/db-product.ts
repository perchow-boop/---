export type DbProduct = {
  product_id: number;
  type_id: string | null;
  type: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProductFormData = {
  type_id: string;
  type: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
};

export const emptyProductForm: ProductFormData = {
  type_id: "",
  type: "",
  name: "",
  description: "",
  price: "",
  stock: "0",
  image_url: "",
};

export const PRODUCT_CATEGORIES = ["器皿","祈願符", "消災符", "答案紙"] as const;
