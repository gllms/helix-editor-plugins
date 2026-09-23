import type { Attachment } from "svelte/attachments";

const DATASET_KEY = "previouslyBlurred";

const previouslyBlurred: Attachment<HTMLElement> = (element) => {
  const onPointerDown = () => {
    element.dataset[DATASET_KEY] = String(document.activeElement !== element);
  };

  const onBlur = () => {
    delete element.dataset[DATASET_KEY];
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("blur", onBlur);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("blur", onBlur);
  };
};

export function wasPreviouslyBlurred(element: HTMLElement): boolean {
  return element.dataset[DATASET_KEY] === "true";
}

export default previouslyBlurred;
