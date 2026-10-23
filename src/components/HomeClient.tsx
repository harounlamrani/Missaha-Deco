"use client";

import { useCallback, useEffect } from "react";
import type { Quote } from "@/lib/types";
import { getAvailableProducts } from "@/data/products";
import { refreshCatalog, useShop } from "@/lib/store";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Carousel } from "@/components/Carousel";
import { CarouselReactions } from "@/components/CarouselReactions";
import { ProductSection } from "@/components/ProductSection";
import { OrderForm } from "@/components/OrderForm";
import { QuotePanel } from "@/components/QuotePanel";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { MobileBar } from "@/components/MobileBar";

export function HomeClient() {
  const { catalog, quote, setQuote } = useShop();
  const products = getAvailableProducts(catalog).filter(
    (p) => p.availability !== "unavailable",
  );

  useEffect(() => {
    refreshCatalog();
  }, []);

  const handleOrder = useCallback(() => {
    document.getElementById("commander")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-white pb-20 text-ink md:pb-0">
      <Header />
      <main>
        <Hero products={products} onOrder={handleOrder} />
        <section aria-label="Galerie du meuble" className="bg-white py-10 md:py-16">
          <div className="car-fit">
            <Carousel />
          </div>
          <CarouselReactions />
        </section>
        {products.map((p) => (
          <ProductSection key={p.id} product={p} />
        ))}
        <section
          id="commander"
          aria-labelledby="commander-titre"
          className="scroll-mt-20 border-t border-line bg-paper"
        >
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange-deep">
              Commande · Paiement à la livraison
            </p>
            <h2 id="commander-titre" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Finalisez votre commande
            </h2>
            <div className="mt-6">
              <OrderForm onQuoted={(q: Quote) => setQuote(q)} />
            </div>
            {quote && (
              <div className="mt-6">
                <QuotePanel quote={quote} />
              </div>
            )}
          </div>
        </section>
        <ContactSection />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}
