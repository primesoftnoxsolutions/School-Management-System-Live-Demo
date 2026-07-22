/**
 * Generic cross-tab / same-tab realtime sync via BroadcastChannel + localStorage + CustomEvent.
 */
export function createCrossTabSync(storageKey) {
  const notify = (detail = {}) => {
    const payload = { ...detail, at: Date.now() };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(storageKey);
        channel.postMessage(payload);
        channel.close();
      }
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent(storageKey, { detail: payload }));
    } catch {
      // ignore
    }
  };

  const subscribe = (callback) => {
    if (typeof callback !== "function") return () => {};

    const onStorage = (event) => {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        callback(JSON.parse(event.newValue));
      } catch {
        callback({ at: Date.now() });
      }
    };

    const onCustom = (event) => callback(event.detail || { at: Date.now() });
    let channel = null;
    const onBroadcast = (event) => callback(event.data || { at: Date.now() });

    window.addEventListener("storage", onStorage);
    window.addEventListener(storageKey, onCustom);
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(storageKey);
        channel.addEventListener("message", onBroadcast);
      }
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(storageKey, onCustom);
      if (channel) {
        channel.removeEventListener("message", onBroadcast);
        channel.close();
      }
    };
  };

  return { notify, subscribe, key: storageKey };
}
