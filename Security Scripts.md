# Website Security Protection Code

This file documents the security protections attached to the School ERP (React + Vite frontend).

Protections covered:

- text selection, copying, and drag/drop (outside form fields)
- image selection, copying, and drag/drop
- common browser inspect shortcuts
- right-click / context menu blocking
- `disable-devtool` CDN script

Important:

- These protections do not change the website layout or visual design.
- A website cannot turn off a browser extension’s own settings from page code.
- **Forms stay usable:** `input`, `textarea`, `select`, and `contenteditable` allow typing, copy, and paste so staff can work in the ERP.

---

## Where it is attached in this project

| Source (your original notes) | Attached in this software |
|---|---|
| `styles.css` rules | `Frontend/src/index.css` |
| `setupInteractionShield()` in `app.js` | `Frontend/src/security/interactionShield.js` (loaded from `Frontend/src/main.jsx`) |
| `disable-devtool` script | `Frontend/index.html` + also injected in production via `main.jsx` |

---

## 1) CSS (`Frontend/src/index.css`)

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  -webkit-touch-callout: none;
}

body {
  -webkit-user-select: none;
  user-select: none;
}

/* ERP exception — keep admin forms editable */
body input,
body textarea,
body select,
body [contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
}

body img,
body picture,
body video,
body canvas,
body svg {
  -webkit-user-drag: none;
  user-drag: none;
}
```

---

## 2) Interaction shield (`Frontend/src/security/interactionShield.js`)

Loaded at app startup from `main.jsx`:

- blocks context menu / select / drag / copy / cut / drop outside forms
- blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+Shift+K
- marks images as non-draggable (including dynamically added images)

---

## 3) `disable-devtool` script (`Frontend/index.html`)

```html
<script disable-devtool-auto src="https://cdn.jsdelivr.net/npm/disable-devtool"></script>
```

Production builds also inject the same script from `main.jsx`.

---

## Result

- Text/images cannot be freely selected, copied, or dragged from the page UI
- Right click is blocked outside form fields
- Common inspect / view-source shortcuts are blocked
- Login and dashboard forms still accept typing, paste, and normal data entry
- Site design and layout are unchanged
