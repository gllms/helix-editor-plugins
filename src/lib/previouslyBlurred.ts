import type { Attachment } from "svelte/attachments";

const previouslyBlurred: Attachment<HTMLElement> = (element) => {
  const onPointerDown = (event: PointerEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement;

    currentTarget.dataset.previouslyBlurred = (document.activeElement !== currentTarget).toString();
  };

  const onBlur = (event: FocusEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement;

    delete currentTarget?.dataset.previouslyBlurred;
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("blur", onBlur);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("blur", onBlur);
  };
};

declare global {
  interface HTMLElement {
    dataset: {
      previouslyBlurred?: string;
    };
  }
}

export default previouslyBlurred;