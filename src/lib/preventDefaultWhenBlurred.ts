import type { Attachment } from "svelte/attachments";

const preventDefaultWhenBlurred: Attachment<HTMLElement> = (element) => {
  const onPointerDown = (event: PointerEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement;

    currentTarget.dataset.previouslyFocused = (
      document.activeElement === currentTarget
    ).toString();
  };

  const onClick = (event: PointerEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement;

    if (window.matchMedia("(pointer: coarse)").matches &&
      currentTarget.dataset.previouslyFocused !== true.toString()) {
      event.preventDefault();
      currentTarget.focus();
    }
  };

  const onBlur = (event: FocusEvent): void => {
    const currentTarget = event.currentTarget as HTMLElement;

    delete currentTarget?.dataset.previouslyFocused;
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("click", onClick);
  element.addEventListener("blur", onBlur);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("click", onClick);
    element.removeEventListener("blur", onBlur);
  };
};

export default preventDefaultWhenBlurred;