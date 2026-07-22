import { createContext, useContext, useMemo } from "react";
import {
  branchToStudentGender,
  normalizeBranch,
  withStudentBranchParams,
  withTeacherBranchParams,
} from "../utils/branch";

const BranchContext = createContext({
  branchSection: "Boys",
  setBranchSection: () => {},
  studentGender: "MALE",
  withStudentParams: (params) => params,
  withTeacherParams: (params) => params,
});

export function BranchProvider({ branchSection = "Boys", onBranchChange, children }) {
  const value = useMemo(() => {
    const normalized = normalizeBranch(branchSection);
    return {
      branchSection: normalized,
      setBranchSection: onBranchChange || (() => {}),
      studentGender: branchToStudentGender(normalized),
      withStudentParams: (params = {}) => withStudentBranchParams(params, normalized),
      withTeacherParams: (params = {}) => withTeacherBranchParams(params, normalized),
    };
  }, [branchSection, onBranchChange]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  return useContext(BranchContext);
}
