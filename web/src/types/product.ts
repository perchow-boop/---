export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  meta: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  inStock: boolean;
  usage: string;
  features: string[];
};

export type CartItem = Product & {
  quantity: number;
};
