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

// Shared, so elements moved by more than one of these animations follow one curve
const duration = 300;
const easing = "ease-out";

function lerp(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function quadraticBezier(start: number, control: number, end: number, amount: number) {
  return lerp(lerp(start, control, amount), lerp(control, end, amount), amount);
}

function smoothstep(amount: number) {
  return amount * amount * (3 - 2 * amount);
}

function closest(target: number, a: number, b: number) {
  return Math.abs(a - target) <= Math.abs(b - target) ? a : b;
}

function center(rect: DOMRect) {
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

/** An animation without keyframes, whose progress drives things that can't be keyframed, like scrolling */
export function animationClock(element: Element) {
  return element.animate(null, { duration, easing });
}

/** Similar to `flip` in Svelte, but animates the element along an arc instead of a straight line, and handles sticky elements better.  */
export function animatePosition(element: HTMLElement, from: DOMRect, to: DOMRect) {
  const [fromX, fromY] = center(from);
  const [toX, toY] = center(to);
  const [controlX, controlY] = fromY < toY ? [fromX, toY] : [toX, fromY];
  const [startScrollX, startScrollY] = [window.scrollX, window.scrollY];
  const clock = animationClock(element);
  const [startLayoutX, startLayoutY] = center(element.getBoundingClientRect());
  let [offsetX, offsetY] = [0, 0];
  let frame = 0;

  function update() {
    const { progress, localTime } = clock.effect!.getComputedTiming();
    if (progress == null) {
      element.style.translate = "";
      return;
    }

    const settle = smoothstep(Math.max((Number(localTime) / duration - 0.8) / 0.2, 0));
    const [scrolledX, scrolledY] = [window.scrollX - startScrollX, window.scrollY - startScrollY];
    const [x, y] = center(element.getBoundingClientRect());
    const [layoutX, layoutY] = [x - offsetX, y - offsetY];
    const [expectedX, expectedY] = [toX - scrolledX, toY - scrolledY];
    const layoutEndX = closest(expectedX, layoutX + (1 - progress) * (toX - startLayoutX), layoutX);
    const layoutEndY = closest(expectedY, layoutY + (1 - progress) * (toY - startLayoutY), layoutY);
    const endX = lerp(expectedX, layoutEndX, settle);
    const endY = lerp(expectedY, layoutEndY, settle);
    offsetX = quadraticBezier(fromX - scrolledX, controlX - scrolledX, endX, progress) - layoutX;
    offsetY = quadraticBezier(fromY - scrolledY, controlY - scrolledY, endY, progress) - layoutY;
    element.style.translate = `${offsetX}px ${offsetY}px`;
    frame = requestAnimationFrame(update);
  }
  update();

  return {
    cancel() {
      clock.cancel();
      cancelAnimationFrame(frame);
      element.style.translate = "";
    },
  };
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
    { duration, easing },
  );
}
