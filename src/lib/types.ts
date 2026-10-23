export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export type Availability = "available" | "unavailable" | "preorder";

export interface Product {
  id: string;
  ref: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  promoPrice?: number;
  images: ProductImage[];
  colors: ProductColor[];
  dimensions?: string;
  material?: string;
  installation?: string;
  packaging?: string;
  installVideoUrl?: string;
  availability: Availability;
  order: number;
}

export type DeliveryMethod = "bureau" | "domicile";

export interface Wilaya {
  id: number;
  name: string;
  nameAr: string;
  deliveryPrices: { bureau: number; domicile: number };
  communes: Commune[];
  requiresCommune: boolean;
}

export interface Commune {
  id: number;
  name: string;
  nameAr: string;
  wilayaId: number;
}

export interface OrderItem {
  productId: string;
  ref: string;
  name: string;
  image?: string;
  color: string;
  unitPrice: number;
  quantity: number;
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  wilayaId: number;
  commune: string;
  address: string;
}

export interface ValidatedOrder {
  items: OrderItem[];
  customer: CustomerInfo;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  wilayaName: string;
}

export interface Quote extends ValidatedOrder {
  number: string;
  date: string;
}
