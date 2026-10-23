"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Availability, Product } from "@/lib/types";
import { defaultProducts } from "@/data/products";

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-brand-orange-deep focus:outline-none";
const labelCls = "mb-1 block text-xs font-semibold text-ink";

const blankProduct = (order: number): Product => ({
  id: `p-${Date.now().toString(36)}`,
  ref: "",
  name: "",
  category: "Rangement mural",
  shortDescription: "",
  description: "",
  price: 6000,
  images: [],
  colors: [{ name: "Blanc", hex: "#ffffff" }],
  dimensions: "",
  material: "",
  installation: "",
  packaging: "",
  installVideoUrl: "",
  availability: "available",
  order,
});

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : defaultProducts))
      .catch(() => setProducts(defaultProducts))
      .finally(() => setLoading(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
    } else {
      const d = await res.json().catch(() => ({}));
      setLoginError((d as { error?: string }).error ?? "Erreur de connexion.");
    }
  }

  async function persist(next: Product[]) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: next }),
    });
    setSaving(false);
    if (res.ok) {
      const d = (await res.json()) as Product[];
      setProducts(d);
      setEditing(null);
      setMessage("Catalogue enregistré durablement.");
    } else if (res.status === 401) {
      setAuthed(false);
      setMessage("Session expirée, reconnectez-vous.");
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage((d as { error?: string }).error ?? "Enregistrement impossible.");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-orange-deep" aria-hidden />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-2xl font-bold text-ink">Admin Missaha DECO</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Accès réservé. Le mot de passe est défini par la variable serveur ADMIN_PASSWORD.
        </p>
        <form onSubmit={login} className="mt-6 space-y-3">
          <div>
            <label htmlFor="admin-pwd" className={labelCls}>Mot de passe</label>
            <input
              id="admin-pwd"
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {loginError && (
            <p className="text-sm text-red-700" role="alert">{loginError}</p>
          )}
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-ink text-base font-bold text-white"
          >
            Se connecter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Catalogue Missaha DECO</h1>
          <p className="text-sm text-ink-soft">
            Les modifications sont enregistrées durablement sur le serveur.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(blankProduct(products.length + 1))}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-yellow px-5 text-sm font-bold text-ink"
        >
          <Plus className="h-4 w-4" aria-hidden /> Ajouter
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-xl bg-brand-yellow-soft px-4 py-3 text-sm text-ink" role="status">
          {message}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {p.name || "Sans nom"} <span className="font-normal text-ink-soft">· {p.ref}</span>
              </p>
              <p className="text-xs text-ink-soft">
                {p.price} DA
                {p.promoPrice ? ` (promo ${p.promoPrice} DA)` : ""} ·{" "}
                {p.availability === "available" ? "Disponible" : p.availability === "preorder" ? "Précommande" : "Indisponible"} ·{" "}
                {p.images.length} photo(s) · {p.colors.length} couleur(s)
              </p>
            </div>
            <button
              type="button"
              aria-label={`Modifier ${p.name}`}
              onClick={() => setEditing({ ...p })}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            {confirmDelete === p.id ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    persist(products.filter((x) => x.id !== p.id));
                    setConfirmDelete(null);
                  }}
                  className="h-11 rounded-full bg-red-700 px-4 text-sm font-bold text-white"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="h-11 rounded-full border border-line px-4 text-sm"
                >
                  Annuler
                </button>
              </span>
            ) : (
              <button
                type="button"
                aria-label={`Supprimer ${p.name}`}
                onClick={() => setConfirmDelete(p.id)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <ProductEditor
          product={editing}
          saving={saving}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => {
            const next = products.some((x) => x.id === editing.id)
              ? products.map((x) => (x.id === editing.id ? editing : x))
              : [...products, editing];
            persist(next);
          }}
        />
      )}
    </main>
  );
}

function ProductEditor({
  product,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  product: Product;
  saving: boolean;
  onChange: (p: Product) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof Product>(k: K, v: Product[K]) =>
    onChange({ ...product, [k]: v });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Éditer le produit">
      <div className="mx-auto my-8 max-w-2xl rounded-3xl bg-white p-6">
        <h2 className="text-lg font-bold text-ink">
          {product.name || "Nouveau produit"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="pe-name">Nom (français) *</label>
            <input id="pe-name" className={inputCls} value={product.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-ref">Référence *</label>
            <input id="pe-ref" className={inputCls} value={product.ref} onChange={(e) => set("ref", e.target.value)} placeholder="MSH-001" />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-price">Prix (DA) *</label>
            <input id="pe-price" type="number" min={0} className={inputCls} value={product.price} onChange={(e) => set("price", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-promo">Prix promo (DA, facultatif)</label>
            <input
              id="pe-promo"
              type="number"
              min={0}
              className={inputCls}
              value={product.promoPrice ?? ""}
              onChange={(e) =>
                set("promoPrice", e.target.value === "" ? undefined : Number(e.target.value))
              }
              placeholder="Vide = pas de promo"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-cat">Catégorie</label>
            <input id="pe-cat" className={inputCls} value={product.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-order">Ordre d’affichage</label>
            <input id="pe-order" type="number" className={inputCls} value={product.order} onChange={(e) => set("order", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pe-short">Description courte</label>
            <input id="pe-short" className={inputCls} value={product.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pe-desc">Description détaillée</label>
            <textarea id="pe-desc" rows={3} className={`${inputCls} h-auto py-3`} value={product.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-dims">Dimensions (vide si non confirmé)</label>
            <input id="pe-dims" className={inputCls} value={product.dimensions ?? ""} onChange={(e) => set("dimensions", e.target.value)} placeholder="Ex. 80 x 60 x 15 cm" />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-mat">Matière (vide si non confirmé)</label>
            <input id="pe-mat" className={inputCls} value={product.material ?? ""} onChange={(e) => set("material", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pe-inst">Montage / fixation (vide si non confirmé)</label>
            <textarea id="pe-inst" rows={2} className={`${inputCls} h-auto py-3`} value={product.installation ?? ""} onChange={(e) => set("installation", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pe-pack">Contenu de l’emballage</label>
            <input id="pe-pack" className={inputCls} value={product.packaging ?? ""} onChange={(e) => set("packaging", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pe-video">Vidéo d’installation (URL, facultatif)</label>
            <input id="pe-video" className={inputCls} dir="ltr" value={product.installVideoUrl ?? ""} onChange={(e) => set("installVideoUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls} htmlFor="pe-avail">Disponibilité</label>
            <select
              id="pe-avail"
              className={inputCls}
              value={product.availability}
              onChange={(e) => set("availability", e.target.value as Availability)}
            >
              <option value="available">Disponible</option>
              <option value="preorder">Précommande</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </div>
        </div>

        {/* Couleurs */}
        <div className="mt-4">
          <p className={labelCls}>Couleurs disponibles</p>
          {product.colors.map((c, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                aria-label={`Nom couleur ${i + 1}`}
                className={inputCls}
                value={c.name}
                onChange={(e) => {
                  const colors = [...product.colors];
                  colors[i] = { ...colors[i], name: e.target.value };
                  set("colors", colors);
                }}
              />
              <input
                aria-label={`Teinte couleur ${i + 1}`}
                type="color"
                className="h-11 w-14 shrink-0 rounded-xl border border-line"
                value={c.hex}
                onChange={(e) => {
                  const colors = [...product.colors];
                  colors[i] = { ...colors[i], hex: e.target.value };
                  set("colors", colors);
                }}
              />
              <button
                type="button"
                aria-label="Retirer cette couleur"
                onClick={() => set("colors", product.colors.filter((_, j) => j !== i))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("colors", [...product.colors, { name: "", hex: "#cccccc" }])}
            className="text-sm font-semibold text-brand-orange-deep"
          >
            + Ajouter une couleur
          </button>
        </div>

        {/* Photos */}
        <div className="mt-4">
          <p className={labelCls}>Photos (max 6 — URLs ou /images/xxx.webp après dépôt dans public/images)</p>
          {product.images.map((img, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                aria-label={`Photo ${i + 1}`}
                dir="ltr"
                className={inputCls}
                value={img.src}
                placeholder="/images/produit-1.webp"
                onChange={(e) => {
                  const images = [...product.images];
                  images[i] = { ...images[i], src: e.target.value };
                  set("images", images);
                }}
              />
              <button
                type="button"
                aria-label="Retirer cette photo"
                onClick={() => set("images", product.images.filter((_, j) => j !== i))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {product.images.length < 6 && (
            <button
              type="button"
              onClick={() =>
                set("images", [...product.images, { src: "", alt: product.name }])
              }
              className="text-sm font-semibold text-brand-orange-deep"
            >
              + Ajouter une photo
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-full border border-line font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
