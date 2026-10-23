"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { SHOTS } from "@/data/carousel";

/* ── la barre de réactions, sous la carrousel ──────────────
   Un compteur par image, tenu côté serveur dans
   data/reactions.json : chaque client reçoit les mêmes
   nombres au chargement, et les relit toutes les 12 s — et à
   chaque retour d'onglet — pour que le total reste vivant
   sans que rien ne bouge tant que personne n'agit.

   La réaction de CE client est parti en POST avec un
   incrément optimiste : le cœur se remplit tout de suite, et
   le nombre affiché est remplacé par la réponse du serveur,
   qui fait foi. Si l'enregistrement échoue (hébergement sans
   persistance), l'incrément s'efface et le micro-message le
   dit — mieux qu'un compteur qui triche. */

const MARK_KEY = "ms_reacted";
const POLL_MS = 12000;

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

  /* les compteurs du serveur, une fois puis par rafales */
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

  const react = async (id: string) => {
    /* une seule réaction par client et par image : la marque
       locale refere le clic et le cœur ne se remplit qu'une
       fois — le compteur, lui, est à tout le monde */
    if (marks.has(id)) return;

    /* l'incrément optimiste, puis le remplacement par la
       réponse du serveur qui seul fait foi */
    setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    const next = new Set(marks);
    next.add(id);
    setMarks(next);
    writeMarks(Array.from(next));
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as { count: number };
      if (!alive.current) return;
      setCounts((c) => ({ ...c, [id]: data.count }));
      setError(false);
      /* les autres clients liront le nouveau total à la
         prochaine rafale, peut-être avant leur clic à eux */
      pull();
    } catch {
      if (!alive.current) return;
      /* l'enregistrement est refusé : le nombre recule d'un et
         la marque se retire, la réaction n'a pas eu lieu */
      setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 1) - 1) }));
      const back = new Set(marks);
      back.delete(id);
      setMarks(back);
      writeMarks(Array.from(back));
      setError(true);
    }
  };

  return (
    <div className="car-react">
      <h2 className="sr-only">Réagir aux photos de la galerie</h2>
      <ul className="car-react-row">
        {SHOTS.map((shot) => {
          const count = counts[shot.name] ?? 0;
          const mine = marks.has(shot.name);
          return (
            <li key={shot.name} className="car-react-chip">
              <img
                className="car-react-thumb"
                src={shot.src}
                alt=""
                width={44}
                height={44}
                draggable={false}
                loading="lazy"
              />
              <motion.button
                type="button"
                className="car-react-btn"
                data-mine={mine}
                onClick={() => react(shot.name)}
                whileTap={still ? undefined : { scale: 0.82 }}
                aria-label={`Réagir à la photo ${shot.name}`}
                aria-live="polite"
              >
                {/* le pop est un REMOUNT (le key change avec la
                    marque), pas un animate : un animate rejouerait
                    les keyframes à chaque rendu où les compteurs
                    arrivent du serveur, et le cœur palserait tout
                    seul pendant que personne n'agit */}
                <motion.span
                  key={mine ? "on" : "off"}
                  className="car-react-heart"
                  initial={
                    mine && !still
                      ? { scale: 0.5, rotate: -10 }
                      : { scale: 1, rotate: 0 }
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 17,
                  }}
                >
                  <Heart
                    size={17}
                    strokeWidth={mine ? 2.4 : 2}
                    fill={mine ? "currentColor" : "none"}
                  />
                </motion.span>
                <span className="car-react-count">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={count}
                      initial={loaded && !still ? { y: 7, opacity: 0 } : false}
                      animate={{ y: 0, opacity: 1 }}
                      exit={
                        loaded && !still ? { y: -7, opacity: 0 } : undefined
                      }
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="car-react-num"
                    >
                      {loaded || count > 0 ? count : "—"}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
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
