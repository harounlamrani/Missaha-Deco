"use client";

import { MessageCircle, ShoppingBag } from "lucide-react";
import { SITE, waLink } from "@/lib/site";

/** Mobile : WhatsApp flottant + bouton Commander fixe. Rien de masqué : padding géré dans page. */
export function MobileBar() {
  return (
    <>
      <a
        href={waLink("Bonjour Missaha DECO, je souhaite des informations.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter Missaha DECO sur WhatsApp"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
        <a
          href="#commander"
          className="flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-5 py-3.5 text-base font-bold text-ink active:scale-[0.98]"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden />
          Commander — {SITE.paymentNote}
        </a>
      </div>
    </>
  );
}
