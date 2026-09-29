import { MediaQuery } from "svelte/reactivity";
import type { TransitionConfig } from "svelte/transition";

export const prefersReducedMotion = new MediaQuery("prefers-reduced-motion: reduce");

type IMotionTransitionOptions<T> = {
  fn: (node: Element, params: T) => TransitionConfig;
} & T;

/** Only applies transition `fn` if `prefers-reduced-motion` is not `reduce` */
export function motionTransition<T>(node: Element, options: IMotionTransitionOptions<T>) {
  if (prefersReducedMotion.current === true) return undefined!;
  return options.fn(node, options);
}

type IMotionAnimationOptions<T> = {
  fn: (node: Element, fromTo: { from: DOMRect; to: DOMRect }, params: T) => TransitionConfig;
} & T;

/** Only applies animation `fn` if `prefers-reduced-motion` is not `reduce` */
export function motionAnimation<T>(
  node: Element,
  fromTo: { from: DOMRect; to: DOMRect },
  options: IMotionAnimationOptions<T>,
) {
  if (prefersReducedMotion.current === true) return undefined!;
  return options.fn(node, fromTo, options);
}

/** Animates the height of `element` in pixels, along with the properties in `extraKeyframes` */
export function animateHeight(
  element: Element,
  fromHeight: number,
  toHeight: number,
  extraKeyframes: [Keyframe, Keyframe] = [{}, {}],
) {
  return element.animate(
    [
      { ...extraKeyframes[0], height: `${fromHeight}px` },
      { ...extraKeyframes[1], height: `${toHeight}px` },
    ],
    { duration: 300, easing: "ease-out" },
  );
}
