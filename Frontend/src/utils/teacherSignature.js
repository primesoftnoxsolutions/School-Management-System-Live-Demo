import api from "../services/api/client";

export const getTeacherSignatureStorageKey = (user) =>
  `teacher-signature:${user?._id || user?.id || user?.fullName || "teacher"}`;

export const readCachedTeacherSignature = (user) => {
  try {
    return localStorage.getItem(getTeacherSignatureStorageKey(user)) || "";
  } catch {
    return "";
  }
};

export const cacheTeacherSignature = (user, signatureDataUrl = "") => {
  try {
    const key = getTeacherSignatureStorageKey(user);
    if (signatureDataUrl) localStorage.setItem(key, signatureDataUrl);
    else localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

export const fetchTeacherSignature = async (user) => {
  try {
    const { data } = await api.get("/teachers/my-panel");
    const signature = data?.data?.signatureDataUrl || "";
    if (signature) cacheTeacherSignature(user, signature);
    return signature || readCachedTeacherSignature(user);
  } catch {
    return readCachedTeacherSignature(user);
  }
};

export const persistTeacherSignature = async (user, signatureDataUrl = "") => {
  const { data } = await api.put("/teachers/my-panel/signature", { signatureDataUrl });
  const saved = data?.data?.signatureDataUrl || "";
  cacheTeacherSignature(user, saved);
  return saved;
};

export const signatureImageHtml = (signatureDataUrl, alt = "Teacher Signature") => {
  if (!signatureDataUrl) {
    return `<div style="height:48px;border-bottom:1px solid #1e3a8a;width:180px;margin:0 auto 6px;"></div>`;
  }
  return `<img src="${signatureDataUrl}" alt="${alt}" style="height:48px;max-width:180px;object-fit:contain;display:block;margin:0 auto 6px;" />`;
};
