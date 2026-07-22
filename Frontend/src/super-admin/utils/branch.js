export const BRANCH_STORAGE_KEY = "schoolDashboardBranchSection";

export const normalizeBranch = (value) => (value === "Girls" ? "Girls" : "Boys");

export const branchToStudentGender = (branch) => (normalizeBranch(branch) === "Girls" ? "FEMALE" : "MALE");

export const studentMatchesBranch = (student, branch) => {
  const gender = String(student?.gender || "").toUpperCase();
  if (!gender || gender === "OTHER") return true;
  return gender === branchToStudentGender(branch);
};

export const teacherMatchesBranch = (teacher, branch) => {
  const selected = normalizeBranch(branch);
  const profileBranch = String(teacher?.profile?.branch || "").trim();
  if (profileBranch === "Boys" || profileBranch === "Girls") {
    return profileBranch === selected;
  }

  const assignments = Array.isArray(teacher?.assignedClasses) ? teacher.assignedClasses : [];
  if (!assignments.length) return true;

  return assignments.some((item) => {
    const assignmentBranch = String(item?.branch || "").trim();
    if (assignmentBranch !== "Boys" && assignmentBranch !== "Girls") return false;
    return assignmentBranch === selected;
  });
};

export const withStudentBranchParams = (params = {}, branch) => ({
  ...params,
  gender: branchToStudentGender(branch),
});

export const withTeacherBranchParams = (params = {}, branch) => ({
  ...params,
  branch: normalizeBranch(branch),
});
