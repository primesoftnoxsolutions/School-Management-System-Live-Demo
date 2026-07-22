import { useEffect, useState } from "react";

export const MODAL_ANIM_MS = 320;

export function useAnimatedPresence(open, duration = MODAL_ANIM_MS) {
  const [render, setRender] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      setExiting(false);
      return undefined;
    }

    if (!render) return undefined;

    setExiting(true);
    const timer = window.setTimeout(() => {
      setRender(false);
      setExiting(false);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, render, duration]);

  return { render, exiting };
}
