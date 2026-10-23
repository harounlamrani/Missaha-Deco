"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ── la barre d'émotions, sous la carrousel ────────────────
   Trois emojis — cœur, fusée, feu — que TOUTE la galerie
   partage : un total par emoji, tenu côté serveur, lu à
   l'arrivée et relu toutes les douze secondes, pour que le
   nombre que vous voyez soit le même que celui des autres.

   Un clic réagit ; un second clic retire sa réaction — le
   compteur descend d'un, la marque part. Chaque pilule se
   remplit chez soi : la marque locale dit « la réaction est
   la mienne », le nombre, lui, est celui de tout le monde.

   L'incrément est optimiste, puis remplacé par la réponse du
   serveur, qui seule fait foi. Un échec d'enregistrement
   (hébergement sans persistance) remet son compteur et sa
   marque en place et le micro-message le dit. */

const POLL_MS = 12000;
const MARK_KEY = "ms_reacted_emoji";

type Reaction = { id: string; emoji: string; label: string };

const REACTIONS: Reaction[] = [
  { id: "heart", emoji: "❤️", label: "J'adore" },
  { id: "rocket", emoji: "🚀", label: "Ça décolle" },
  { id: "fire", emoji: "🔥", label: "Génial" },
];

const readMarks = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(MARK_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
};

const writeMarks = (ids: string[]) => {
  try {
    localStorage.setItem(MARK_KEY, JSON.stringify(ids));
  } catch {
    /* stockage privé : les marques ne survivent pas à la page */
  }
};

export function CarouselReactions() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const alive = useRef(true);
  const still = useReducedMotion();

  /* les compteurs du serveur, au chargement puis à chaque
     rafale de douze secondes — et à chaque retour d'onglet,
     pour que la galerie s'anime dès qu'on la re-regarde */
  const pull = useCallback(async () => {
    try {
      const res = await fetch("/api/reactions", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, number>;
      if (!alive.current) return;
      setCounts(data);
      setError(false);
      setLoaded(true);
    } catch {
      /* le compteur reste à sa dernière valeur connue */
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    /* les marques venues du stockage local, et la première
       lecture du serveur, posés sur un timer de 0ms : un
       setState atteint droit depuis le corps de l'effect est
       celui dont les règles de React se méfient, et le
       Carousel le parque déjà ainsi (see `mounted`) */
    const t0 = setTimeout(() => {
      setMarks(new Set(readMarks()));
      pull();
    }, 0);
    const id = setInterval(pull, POLL_MS);
    const wake = () => document.visibilityState === "visible" && pull();
    document.addEventListener("visibilitychange", wake);
    return () => {
      alive.current = false;
      clearTimeout(t0);
      clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [pull]);

  const react = (id: string) => {
    const mine = marks.has(id);
    const dir: 1 | -1 = mine ? -1 : 1;

    /* l'optimisme d'abord : le compteur bouge tout de suite,
       la marque suit — le serveur remplacera le nombre par
       le sien, qui seul fait foi */
    setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + dir) }));
    const next = new Set(marks);
    if (mine) next.delete(id);
    else next.add(id);
    setMarks(next);
    writeMarks(Array.from(next));

    fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, dir }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("save failed");
        const data = (await res.json()) as { count: number };
        if (!alive.current) return;
        setCounts((c) => ({ ...c, [id]: data.count }));
        setError(false);
      })
      .catch(() => {
        if (!alive.current) return;
        /* l'enregistrement est refusé : le nombre recule et
           la marque se retire, la réaction n'a pas eu lieu */
        setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - dir) }));
        const back = new Set(marks);
        if (mine) back.add(id);
        else back.delete(id);
        setMarks(back);
        writeMarks(Array.from(back));
        setError(true);
      });
  };

  /* ── le pop ────────────────────────────────────────────────
      Un REMOUNT (le key change avec la marque), pas un
      animate : un animate rejouerait ses keyframes à chaque
      rendu où les compteurs arrivent du serveur, et les
      emojis palseraient tout seuls pendant que personne
      n'agit. */
  return (
    <div className="car-react">
      <h2 className="sr-only">Réagir à la galerie</h2>
      <div className="car-react-row" role="group" aria-label="Réactions">
        {REACTIONS.map((reaction) => {
          const count = counts[reaction.id] ?? 0;
          const mine = marks.has(reaction.id);
          return (
            <motion.button
              type="button"
              key={reaction.id}
              className="car-react-pill"
              data-mine={mine}
              onClick={() => react(reaction.id)}
              whileTap={still ? undefined : { scale: 0.86 }}
              aria-pressed={mine}
              aria-label={`${reaction.emoji} ${reaction.label}`}
              aria-live="polite"
            >
              <motion.span
                key={mine ? "on" : "off"}
                className="car-react-emoji"
                initial={
                  mine && !still
                    ? { scale: 0.4, rotate: -14 }
                    : { scale: 1, rotate: 0 }
                }
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 17 }}
              >
                {reaction.emoji}
              </motion.span>
              <span className="car-react-count">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={count}
                    initial={loaded && !still ? { y: 8, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={loaded && !still ? { y: -8, opacity: 0 } : undefined}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="car-react-num"
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="car-react-err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Réaction non enregistrée : le stockage est indisponible.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
