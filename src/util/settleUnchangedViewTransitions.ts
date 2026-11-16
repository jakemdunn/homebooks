const PSEUDO = /^::view-transition-(group|old|new)\((.+)\)$/;
const GEOMETRY = ["transform", "width", "height"] as const;

/** Which view transition pseudo-element an animation runs on, if any. */
const transitionPseudo = (animation: Animation) => {
  const effect = animation.effect as KeyframeEffect | null;
  const [, part, name] = effect?.pseudoElement?.match(PSEUDO) ?? [];
  return effect && part && name ? { effect, part, name } : undefined;
};

/** The name of a view transition group that neither moves nor resizes. */
const staticGroupName = (animation: Animation) => {
  const pseudo = transitionPseudo(animation);
  if (pseudo?.part !== "group") return undefined;
  const frames = pseudo.effect.getKeyframes();
  const [first, last] = [frames[0], frames.at(-1)];
  // The browser's own group animation always sets these. React's hiding of
  // cancelled groups only sets opacity, and is left alone.
  if (!first || !last || !("transform" in first)) return undefined;
  return GEOMETRY.every((property) => first[property] === last[property])
    ? pseudo.name
    : undefined;
};

/**
 * Shows each element that neither moves nor resizes in its new state
 * straight away, instead of cross-fading two identical snapshots, which
 * flickers. React drops such elements itself only when nothing on the page
 * resized, which an expanding Folder always does.
 */
export const settleUnchangedViewTransitions = (document: Document) => {
  const animations = document.getAnimations();
  const names = new Set(animations.flatMap((a) => staticGroupName(a) ?? []));
  if (!names.size) return;
  try {
    // Hide the old snapshots first: if a browser rejects this, nothing has
    // been cancelled yet and its usual cross-fade runs instead.
    for (const name of names)
      document.documentElement.animate(
        { opacity: [0, 0] },
        {
          duration: 0,
          fill: "forwards",
          pseudoElement: `::view-transition-old(${name})`,
        },
      );
  } catch {
    return;
  }
  for (const animation of animations) {
    const pseudo = transitionPseudo(animation);
    if (pseudo && names.has(pseudo.name)) animation.cancel();
  }
};

/** Settles unchanged elements in every view transition the page starts. */
export const installViewTransitionSettling = (document: Document) => {
  if (!document.startViewTransition) return;
  const start = document.startViewTransition.bind(document);
  document.startViewTransition = ((...args: Parameters<typeof start>) => {
    const transition = start(...args);
    transition.ready
      .then(() => settleUnchangedViewTransitions(document))
      .catch(() => {});
    return transition;
  }) as typeof document.startViewTransition;
};
