import { Admission } from "../../models/Admission.js";
import { ApiError } from "../../utils/apiError.js";
import {
  createStudentAndAdmissionRepo,
  listAdmissionsRepo,
} from "./admissions.repository.js";
import {
  generateAdmissionNo,
  getNextRollNumber,
} from "../students/students.service.js";

/** Sequential admission history number: ADM-2026-000001 */
export const generateHistoryAdmissionNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const rows = await Admission.find({
    admissionNo: { $regex: `^${escaped}\\d+$`, $options: "i" },
    isDeleted: false,
  })
    .select("admissionNo")
    .lean();

  let maxSeq = 0;
  rows.forEach((row) => {
    const match = new RegExp(`^${escaped}(\\d+)$`, "i").exec(String(row.admissionNo || ""));
    if (!match) return;
    const value = Number(match[1]);
    if (!Number.isNaN(value)) maxSeq = Math.max(maxSeq, value);
  });

  return `${prefix}${String(maxSeq + 1).padStart(6, "0")}`;
};

export const getNextHistoryAdmissionNo = async () => generateHistoryAdmissionNo();

export const createAdmissionService = async (payload, actorId) => {
  const required = [
    "firstName",
    "lastName",
    "gender",
    "guardianName",
    "guardianPhone",
    "className",
    "section",
  ];

  const prepared = {
    ...payload,
    guardianPhone: String(payload.callNumber || payload.guardianPhone || "").trim(),
    alternativePhone: String(payload.whatsappNumber || payload.alternativePhone || "").trim(),
    section: (payload.section || "A").trim(),
  };

  const missing = required.filter((field) => !prepared[field]);
  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
  }

  if (!prepared.dateOfBirth) {
    prepared.dateOfBirth = "2010-01-01";
  }

  // Always assign sequential ADM-YYYY-000001 (ignore random client preview).
  const historyAdmissionNo = await generateHistoryAdmissionNo();
  const studentId = await generateAdmissionNo(prepared.className, prepared.section);

  const rollNumber =
    String(prepared.rollNumber || "").trim() ||
    (await getNextRollNumber(prepared.className, prepared.section));

  const preparedPayload = {
    ...prepared,
    admissionNo: studentId,
    historyAdmissionNo,
    rollNumber,
  };

  return createStudentAndAdmissionRepo(preparedPayload, actorId);
};

export const listAdmissionsService = async (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);

  return listAdmissionsRepo({
    page,
    limit,
    search: query.search || "",
    className: query.className || "",
    section: query.section || "",
    from: query.from || "",
    to: query.to || "",
    gender: query.gender || "",
    branch: query.branch || "",
  });
};
