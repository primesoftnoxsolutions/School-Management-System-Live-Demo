/**
 * Best-effort page protection adapted for this School ERP (React + Vite).
 * Form fields (input/textarea/select/contenteditable) stay usable for normal work.
 */
const FORM_FIELD_SELECTOR = "input, textarea, select, [contenteditable='true']";

const isFormFieldTarget = (target) => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(FORM_FIELD_SELECTOR));
};

export const setupInteractionShield = () => {
  if (typeof window === "undefined" || window.__interactionShieldReady) return;

  const blockPointerAction = (event) => {
    if (isFormFieldTarget(event.target)) return;
    event.preventDefault();
  };

  document.documentElement.setAttribute("translate", "no");

  document.addEventListener("contextmenu", blockPointerAction, true);
  document.addEventListener("selectstart", blockPointerAction, true);
  document.addEventListener("dragstart", blockPointerAction, true);
  document.addEventListener("copy", blockPointerAction, true);
  document.addEventListener("cut", blockPointerAction, true);
  document.addEventListener("drop", blockPointerAction, true);

  document.addEventListener(
    "keydown",
    (event) => {
      if (isFormFieldTarget(event.target)) {
        // Allow normal typing shortcuts inside forms (copy/paste/select-all).
        const key = (event.key || "").toLowerCase();
        const ctrlOrMeta = event.ctrlKey || event.metaKey;
        if (ctrlOrMeta && ["c", "v", "x", "a", "z", "y"].includes(key)) return;
      }

      const key = (event.key || "").toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      const isInspectShortcut =
        event.key === "F12" ||
        (ctrlOrMeta && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (ctrlOrMeta && key === "u") ||
        (ctrlOrMeta && key === "s") ||
        (ctrlOrMeta && key === "p");

      if (!isInspectShortcut) return;

      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      const key = (event.key || "").toLowerCase();
      if (!((event.ctrlKey || event.metaKey) && event.shiftKey && key === "k")) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  const markImages = () => {
    document.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
    });
  };

  markImages();

  const observer = new MutationObserver(() => markImages());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.__interactionShieldReady = true;
};

/** Loads disable-devtool from CDN (production builds). */
export const loadDisableDevtool = () => {
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-disable-devtool]")) return;

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/disable-devtool";
  script.setAttribute("disable-devtool-auto", "");
  script.setAttribute("data-disable-devtool", "true");
  script.async = true;
  document.head.appendChild(script);
};
