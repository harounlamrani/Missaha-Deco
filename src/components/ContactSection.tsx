"use client";

import { MessageCircle, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";
import { SITE, waLink } from "@/lib/site";

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-titre" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange-deep">
          Contact
        </p>
        <h2 id="contact-titre" className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Une question sur le meuble ou la livraison ?
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-ink-soft">
          Écrivez-nous sur WhatsApp pour commander ou poser vos questions. Réponse rapide,
          en français ou en arabe.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href={waLink("Bonjour Missaha DECO, je souhaite des informations.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white transition hover:bg-black"
          >
            <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-bold">WhatsApp</span>
              <span className="block text-xs opacity-80" dir="ltr">{SITE.whatsappDisplay}</span>
            </span>
          </a>
          <a
            href={`tel:+${SITE.whatsappIntl}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-ink"
          >
            <Phone className="h-6 w-6 shrink-0 text-brand-orange-deep" aria-hidden />
            <span>
              <span className="block text-sm font-bold text-ink">Téléphone</span>
              <span className="block text-xs text-ink-soft" dir="ltr">{SITE.whatsappDisplay}</span>
            </span>
          </a>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-ink"
          >
            <InstagramIcon className="h-6 w-6 shrink-0 text-brand-orange-deep" />
            <span>
              <span className="block text-sm font-bold text-ink">Instagram</span>
              <span className="block text-xs text-ink-soft">Nos installations</span>
            </span>
          </a>
          <a
            href={SITE.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-ink"
          >
            <FacebookIcon className="h-6 w-6 shrink-0 text-brand-orange-deep" />
            <span>
              <span className="block text-sm font-bold text-ink">Facebook</span>
              <span className="block text-xs text-ink-soft">Actualités & promos</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
