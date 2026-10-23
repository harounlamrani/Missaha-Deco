"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { CreepyButton } from "@/components/ui/creepy-button";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const NAV = [
  { label: "Accueil", href: "#accueil" },
  { label: "Produits", href: "#produits" },
  { label: "Contact", href: "#contact" },
];

function scrollToOrder() {
  document.getElementById("commander")?.scrollIntoView();
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow ${
        scrolled ? "border-line shadow-sm" : "border-transparent"
      }`}
    >
      <nav
        className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Navigation principale"
      >
        <a href="#accueil" aria-label="Missaha DECO — Accueil">
          <Logo compact />
        </a>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        >
          {reducedMotion ? (
            <span className="block text-sm font-bold tracking-[0.2em] text-black sm:text-base sm:tracking-[0.28em]">
              MISSAHA DECO
            </span>
          ) : (
            <FlipFadeText
              words={["MISSAHA\u00A0DECO", "MISSAHA\u200BDECO"]}
              interval={4000}
              letterDuration={0.5}
              staggerDelay={0.08}
              exitStaggerDelay={0.04}
              className="min-h-0"
              textClassName="text-sm tracking-[0.16em] text-black sm:text-base sm:tracking-[0.24em]"
            />
          )}
        </div>
        <div className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
          {reducedMotion ? (
            <a
              href="#commander"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
            >
              Commander
            </a>
          ) : (
            <CreepyButton
              onClick={scrollToOrder}
              className="rounded-full"
              coverClassName="rounded-full bg-brand-yellow text-ink text-sm font-semibold tracking-normal"
            >
              Commander
            </CreepyButton>
          )}
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink md:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-5 pt-2 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-paper"
            >
              {item.label}
            </a>
          ))}
          {reducedMotion ? (
            <a
              href="#commander"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-ink px-5 py-3 text-center text-base font-semibold text-white"
            >
              Commander
            </a>
          ) : (
            <div className="mt-3">
              <CreepyButton
                onClick={() => {
                  setOpen(false);
                  scrollToOrder();
                }}
                className="h-12 w-full rounded-full"
                coverClassName="rounded-full bg-brand-yellow text-ink text-base font-semibold tracking-normal"
              >
                Commander
              </CreepyButton>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
