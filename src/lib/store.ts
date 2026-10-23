import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CustomerInfo,
  DeliveryMethod,
  Product,
  Quote,
} from "./types";
import { defaultProducts } from "@/data/products";

export interface DraftItem {
  productId: string;
  color: string;
  quantity: number;
}

interface ShopState {
  catalog: Product[];
  catalogLoaded: boolean;
  draftItems: DraftItem[];
  customer: CustomerInfo;
  deliveryMethod: DeliveryMethod;
  quote: Quote | null;
  setCatalog: (p: Product[]) => void;
  setDraftItems: (items: DraftItem[]) => void;
  setCustomer: (c: CustomerInfo) => void;
  setDeliveryMethod: (m: DeliveryMethod) => void;
  setQuote: (q: Quote | null) => void;
  resetOrder: () => void;
}

const emptyCustomer: CustomerInfo = {
  fullName: "",
  phone: "",
  wilayaId: 0,
  commune: "",
  address: "",
};

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      catalog: defaultProducts,
      catalogLoaded: false,
      draftItems: [],
      customer: emptyCustomer,
      deliveryMethod: "bureau",
      quote: null,
      setCatalog: (catalog) => set({ catalog, catalogLoaded: true }),
      setDraftItems: (draftItems) => set({ draftItems }),
      setCustomer: (customer) => set({ customer }),
      setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),
      setQuote: (quote) => set({ quote }),
      resetOrder: () =>
        set({ draftItems: [], customer: emptyCustomer, quote: null }),
    }),
    {
      name: "missaha-shop",
      partialize: (s) => ({
        draftItems: s.draftItems,
        customer: s.customer,
        deliveryMethod: s.deliveryMethod,
        quote: s.quote,
      }),
    },
  ),
);

export async function refreshCatalog(): Promise<void> {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Product[];
    if (Array.isArray(data)) useShop.getState().setCatalog(data);
  } catch {
    // hors-ligne : on garde le catalogue intégré
  }
}
