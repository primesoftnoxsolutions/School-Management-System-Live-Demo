import { useEffect } from "react";

export function useAppThemeClass(isDark) {
  useEffect(() => {
    document.documentElement.classList.toggle("dashboard-dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);
}
