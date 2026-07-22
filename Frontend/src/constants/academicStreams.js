import { CLASS_OPTIONS } from "./classes";

const LOWER_GRADE_CLASSES = CLASS_OPTIONS.slice(0, CLASS_OPTIONS.indexOf("Grade 11"));

export const LOWER_STREAM_OPTIONS = ["Biology", "Computer"];

export const SENIOR_STREAM_OPTIONS = ["Medical", "ICS"];

export const ICS_DETAIL_OPTIONS = ["ICS with Math", "ICS with Economics", "ICS with Stats"];

export const isSeniorClass = (className) => ["Grade 11", "Grade 12"].includes(className);

export const getStreamConfig = (className) => {
  if (!className) return { tier: "none", options: [] };
  if (isSeniorClass(className)) return { tier: "senior", options: SENIOR_STREAM_OPTIONS };
  if (LOWER_GRADE_CLASSES.includes(className) || className === "Graduation") {
    return { tier: "lower", options: LOWER_STREAM_OPTIONS };
  }
  return { tier: "none", options: [] };
};
