import { getCampusTimeTable, saveCampusTimeTable } from "./timetables.service.js";

export const getTimeTable = async (req, res, next) => {
  try {
    const branch = req.query.branch || "Boys";
    const data = await getCampusTimeTable(branch);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const putTimeTable = async (req, res, next) => {
  try {
    const data = await saveCampusTimeTable(req.body, req.user?.id);
    res.status(200).json({ success: true, data, message: "Time table saved successfully" });
  } catch (error) {
    next(error);
  }
};
