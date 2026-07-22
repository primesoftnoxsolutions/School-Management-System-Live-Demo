import api from "../services/api/client";

export const getAdminSignatureStorageKey = (user) =>
  `admin-signature:${user?._id || user?.id || user?.fullName || "admin"}`;

export const readCachedAdminSignature = (user) => {
  try {
    return localStorage.getItem(getAdminSignatureStorageKey(user)) || "";
  } catch {
    return "";
  }
};

export const cacheAdminSignature = (user, signatureDataUrl = "") => {
  try {
    const key = getAdminSignatureStorageKey(user);
    if (signatureDataUrl) localStorage.setItem(key, signatureDataUrl);
    else localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

export const fetchAdminSignature = async (user) => {
  try {
    const { data } = await api.get("/auth/me/signature");
    const signature = data?.data?.signatureDataUrl || "";
    if (signature) cacheAdminSignature(user, signature);
    return signature || readCachedAdminSignature(user);
  } catch {
    return readCachedAdminSignature(user);
  }
};

export const persistAdminSignature = async (user, signatureDataUrl = "") => {
  const { data } = await api.put("/auth/me/signature", { signatureDataUrl });
  const saved = data?.data?.signatureDataUrl || "";
  cacheAdminSignature(user, saved);
  return saved;
};
