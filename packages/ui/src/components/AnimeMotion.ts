import { animate, stagger } from "animejs";

type AnimeTargets = Parameters<typeof animate>[0];
type AnimeParams = Parameters<typeof animate>[1];

export function motionEnabled() {
  return (
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function animeReveal(
  targets: AnimeTargets,
  overrides: Partial<AnimeParams> = {},
) {
  if (!motionEnabled()) return null;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [18, 0],
    duration: 620,
    delay: stagger(55),
    ease: "out(4)",
    ...overrides,
  });
}

export { animate, stagger };
