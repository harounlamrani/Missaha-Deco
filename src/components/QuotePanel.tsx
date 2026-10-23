"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, MessageCircle } from "lucide-react";
import type { Quote } from "@/lib/types";
import { formatDA } from "@/lib/format";
import { downloadQuotePdf } from "@/lib/pdf";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from "@/components/ui/receipt-printer";

export function QuotePanel({ quote }: { quote: Quote }) {
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");

  useEffect(() => {
    const t0 = window.setTimeout(() => setStage("processing"), 0);
    const t1 = window.setTimeout(() => setStage("printing"), 1400);
    const t2 = window.setTimeout(
      () => setStage("complete"),
      1400 + 2150,
    );
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [quote.number]);

  async function onDownload() {
    setDownloading(true);
    setPdfError("");
    try {
      await downloadQuotePdf(quote);
    } catch {
      setPdfError("Téléchargement impossible. Réessayez.");
    } finally {
      setDownloading(false);
    }
  }

  const issued = new Date(quote.date);

  return (
    <div id="devis" className="scroll-mt-24 rounded-3xl border-2 border-ink bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow">
          <FileText className="h-6 w-6 text-ink" aria-hidden />
        </span>
        <div>
          <h3 className="text-xl font-bold text-ink">Votre devis {quote.number}</h3>
          <p className="text-sm text-ink-soft">
            Vérifiez le récapitulatif, téléchargez le PDF, puis confirmez sur WhatsApp.
          </p>
        </div>
      </div>

      <ReceiptPrinter.Root
        stage={stage}
        className="mx-auto mt-6"
        aria-label={`Imprimante du devis ${quote.number}`}
      >
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <span className="flex items-center gap-2 pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt=""
                width={26}
                height={26}
                className="h-[26px] w-[26px] rounded-md object-cover"
              />
              <span className="text-xs font-bold tracking-[0.14em] text-grayscale-1">
                MISSAHA DECO
              </span>
            </span>
            <span className="rounded-md bg-grayscale-4 px-2 py-0.5 font-mono text-[11px] text-grayscale-12">
              Dev#{quote.number}
            </span>
          </ReceiptPrinter.Header>
          <ReceiptPrinter.Screen>
            <ReceiptPrinter.Status />
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        <ReceiptPrinter.Output className="h-[26rem]">
          <ReceiptPrinter.Paper className="text-[13px] leading-5">
            <header className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold tracking-wide">MISSAHA DECO</p>
                <p dir="rtl" lang="ar" className="text-[11px] text-grayscale-8">
                  مساحة ديغو
                </p>
              </div>
              <p className="text-right text-[11px] text-grayscale-8">
                {issued.toLocaleDateString("fr-FR")}
                {" · "}
                {issued.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </header>

            <div className="mt-3 border-t border-dashed border-grayscale-4" />

            <ul className="mt-3 space-y-1.5">
              {quote.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {it.name}
                    <span className="text-grayscale-8"> · {it.color} ×{it.quantity}</span>
                  </span>
                  <span className="shrink-0">{formatDA(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 border-t border-dashed border-grayscale-4" />

            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between gap-3">
                <span className="text-grayscale-8">
                  Livraison {quote.deliveryMethod === "domicile" ? "domicile" : "bureau"} · {quote.wilayaName}
                </span>
                <span className="shrink-0">{formatDA(quote.deliveryPrice)}</span>
              </div>
              <div className="flex justify-between gap-3 text-base font-bold">
                <span>TOTAL</span>
                <span className="shrink-0">{formatDA(quote.total)}</span>
              </div>
              <p className="text-[11px] text-grayscale-8">Paiement à la livraison</p>
            </div>

            <div className="mt-3 border-t border-dashed border-grayscale-4" />

            <footer className="mt-3 text-[11px] leading-4 text-grayscale-8">
              <p>
                {quote.customer.fullName} · {quote.customer.phone}
              </p>
              <p>
                {quote.customer.commune}, {quote.customer.address}
              </p>
              <p className="mt-1 text-grayscale-12">
                Merci ! Joignez ce reçu à votre message WhatsApp.
              </p>
            </footer>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-6 py-3 text-base font-bold text-ink transition hover:bg-paper active:scale-[0.99] disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Download className="h-5 w-5" aria-hidden />
          )}
          Télécharger le devis (PDF)
        </button>
        {pdfError && (
          <p className="text-sm text-red-700" role="alert">{pdfError}</p>
        )}
        <a
          href={buildWhatsAppLink(quote)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1faa53] px-6 py-3.5 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Confirmer ma commande sur WhatsApp
        </a>
        <p className="rounded-2xl bg-brand-yellow-soft px-4 py-3 text-sm leading-6 text-ink">
          Les liens WhatsApp ne permettent pas de joindre un fichier automatiquement :
          téléchargez le PDF ci-dessus, puis joignez-le à votre message avec le bouton trombone.
        </p>
      </div>
    </div>
  );
}
