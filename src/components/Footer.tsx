"use client";

import { MessageCircle } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";
import { SITE, waLink } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-soft">
            {SITE.category} — petite marque déco moderne en Algérie.{" "}
            {SITE.paymentNote}.
          </p>
        </div>
        <nav aria-label="Navigation pied de page">
          <p className="text-sm font-semibold text-ink">Naviguer</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {[
              ["Accueil", "#accueil"],
              ["Produits", "#produits"],
              ["Contact", "#contact"],
              ["Commander", "#commander"],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-ink">Suivre & commander</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <a
                href={waLink("Bonjour Missaha DECO, je souhaite des informations.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-ink"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                WhatsApp — {SITE.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-ink"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href={SITE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-ink"
              >
                <FacebookIcon className="h-4 w-4" />
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-soft sm:px-6">
          © {new Date().getFullYear()} {SITE.brandDisplay} — {SITE.brandAr} · Alger,
          Algérie
        </p>
      </div>
    </footer>
  );
}
