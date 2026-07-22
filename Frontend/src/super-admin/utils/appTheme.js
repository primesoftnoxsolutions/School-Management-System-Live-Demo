const THEME_STORAGE_KEY = "appTheme";

export function readAppThemeDark() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light") return false;
    if (stored === "dark") return true;
  } catch {
    // ignore storage errors
  }
  return true;
}

export function writeAppThemeDark(isDark) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  } catch {
    // ignore storage errors
  }
}
