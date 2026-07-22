import { TeacherActivity } from "../../models/TeacherActivity.js";

export const logTeacherActivity = async (teacherId, action, module, details = "", status = "SUCCESS") => {
  await TeacherActivity.create({
    teacherId,
    action,
    module,
    details,
    status,
    createdBy: teacherId.toString(),
  });
};
