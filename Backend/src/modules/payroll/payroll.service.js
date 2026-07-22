import { Payroll } from "../../models/Payroll.js";
import { TeacherProfile } from "../../models/TeacherProfile.js";
import { User } from "../../models/User.js";
import { ApiError } from "../../utils/apiError.js";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

const calcNet = (paySalary, allowances, deductions, bonus) =>
  Math.max(Number(paySalary || 0) + Number(allowances || 0) + Number(bonus || 0) - Number(deductions || 0), 0);

const getPayrollKey = (item) => `${item.staffId?.toString?.() || item.staffId}-${item.month}-${item.year}`;

const genPayslipNo = () => `PSL-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

const toEmployeeCode = (userId) => {
  const raw = String(userId || "");
  return `EMP-${raw.slice(-6).toUpperCase()}`;
};

const roleToDepartment = (role) => {
  if (role === "ACCOUNTANT") return "Finance";
  if (role === "TEACHER") return "Teaching";
  if (role === "SUPER_ADMIN") return "Administration";
  return role || "Staff";
};

const monthIndex = (month) => {
  const idx = MONTHS.findIndex((item) => item.toLowerCase() === String(month || "").toLowerCase());
  return idx >= 0 ? idx : 0;
};

const enrichPayrollItems = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = getPayrollKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const remainingById = new Map();
  groups.forEach((group) => {
    let paidSoFar = 0;
    [...group]
      .sort((a, b) => new Date(a.paidAt || a.createdAt || 0) - new Date(b.paidAt || b.createdAt || 0))
      .forEach((row) => {
        if (row.status === "PAID") {
          paidSoFar += Number(row.paySalary ?? row.netSalary ?? 0);
        }
        remainingById.set(row._id.toString(), Math.max(Number(row.basicSalary || 0) - paidSoFar, 0));
      });
  });

  return items.map((item) => {
    const group = groups.get(getPayrollKey(item)) || [];
    const totalPaidSalary = group
      .filter((row) => row.status === "PAID")
      .reduce((sum, row) => sum + Number(row.paySalary ?? row.netSalary ?? 0), 0);
    const totalPaidNetSalary = group
      .filter((row) => row.status === "PAID")
      .reduce((sum, row) => sum + Number(row.netSalary || 0), 0);
    const remainingSalary = Math.max(Number(item.basicSalary || 0) - totalPaidSalary, 0);
    const displayStatus =
      remainingSalary > 0 && totalPaidSalary > 0 ? "PARTIAL" : remainingSalary > 0 ? "PENDING" : "PAID";

    return {
      ...item,
      paySalary: Number(item.paySalary ?? item.netSalary ?? 0),
      payslipNo: item.payslipNo || (item.status === "PAID" ? `PSL-${String(item._id).slice(-8).toUpperCase()}` : ""),
      employeeCode: item.employeeCode || toEmployeeCode(item.staffId),
      department: item.department || roleToDepartment(item.staffRole),
      designation: item.designation || item.staffRole || "",
      campus: item.campus || "",
      totalPaidSalary,
      totalPaidNetSalary,
      remainingSalary,
      remainingAtPayment: remainingById.get(item._id.toString()) ?? remainingSalary,
      displayStatus,
      pendingMonthsCount: remainingSalary > 0 ? 1 : 0,
      salaryPayments: group
        .filter((row) => row.status === "PAID")
        .sort((a, b) => new Date(a.paidAt || a.updatedAt || 0) - new Date(b.paidAt || b.updatedAt || 0))
        .map((row) => ({
          _id: row._id,
          month: row.month,
          year: row.year,
          paySalary: Number(row.paySalary ?? row.netSalary ?? 0),
          netSalary: Number(row.netSalary || 0),
          paymentMethod: row.paymentMethod,
          paidAt: row.paidAt,
          payslipNo: row.payslipNo || `PSL-${String(row._id).slice(-8).toUpperCase()}`,
          transactionRef: row.transactionRef || "",
          remainingAtPayment: remainingById.get(row._id.toString()) ?? remainingSalary,
          remarks: row.remarks,
        })),
    };
  });
};

const loadStaffProfileMap = async (staffIds = []) => {
  if (!staffIds.length) return new Map();
  const profiles = await TeacherProfile.find({ teacherId: { $in: staffIds }, isDeleted: false })
    .select("teacherId salary branch designation")
    .lean();
  return new Map(profiles.map((profile) => [profile.teacherId.toString(), profile]));
};

const attachStaffMeta = async (items) => {
  const staffIds = [...new Set(items.map((item) => item.staffId?.toString?.() || String(item.staffId)).filter(Boolean))];
  const [profileMap, processors] = await Promise.all([
    loadStaffProfileMap(staffIds),
    User.find({ _id: { $in: items.map((item) => item.processedBy).filter(Boolean) } })
      .select("_id fullName")
      .lean(),
  ]);
  const processorMap = new Map(processors.map((user) => [user._id.toString(), user.fullName]));

  return items.map((item) => {
    const profile = profileMap.get(item.staffId?.toString?.() || String(item.staffId));
    return {
      ...item,
      campus: item.campus || profile?.branch || "",
      designation: item.designation || profile?.designation || item.staffRole || "",
      department: item.department || roleToDepartment(item.staffRole),
      employeeCode: item.employeeCode || toEmployeeCode(item.staffId),
      processedByName: processorMap.get(item.processedBy?.toString?.() || String(item.processedBy)) || "System",
    };
  });
};

export const listPayroll = async (query) => {
  const { page, limit, search } = parsePage(query);
  const filter = { isDeleted: false };
  if (query.month) filter.month = query.month;
  if (query.year) filter.year = Number(query.year);
  if (query.staffId) filter.staffId = query.staffId;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.campus) filter.campus = query.campus;
  if (query.department) filter.department = query.department;
  if (query.designation) filter.designation = { $regex: query.designation, $options: "i" };
  if (query.employeeCode) filter.employeeCode = { $regex: query.employeeCode, $options: "i" };

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (search) {
    filter.$or = [
      { staffName: { $regex: search, $options: "i" } },
      { staffRole: { $regex: search, $options: "i" } },
      { employeeCode: { $regex: search, $options: "i" } },
      { payslipNo: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
      { campus: { $regex: search, $options: "i" } },
    ];
  }

  const allItems = await Payroll.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).lean();
  const withMeta = await attachStaffMeta(allItems);
  const enrichedItems = enrichPayrollItems(withMeta);
  const groupMap = new Map();
  enrichedItems.forEach((item) => {
    const key = getPayrollKey(item);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(item);
  });

  const status = String(query.status || "").toUpperCase();
  const filteredGroups = [...groupMap.values()].filter((group) => {
    const displayStatus = group[0]?.displayStatus;
    if (!status || status === "ALL") return true;
    if (status === "PAID" || status === "CLEARED") return displayStatus === "PAID";
    if (status === "PENDING") return displayStatus === "PENDING" || displayStatus === "PARTIAL";
    if (status === "PARTIAL" || status === "PARTIAL_PAID") return displayStatus === "PARTIAL";
    if (status === "CANCELLED") return false;
    return displayStatus === status;
  });

  const total = filteredGroups.length;
  const items = filteredGroups.slice((page - 1) * limit, page * limit).flat();

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
};

export const getStaffOptions = async () => {
  const staff = await User.find({
    role: { $in: ["TEACHER", "ACCOUNTANT"] },
    isDeleted: false,
    isActive: true,
  })
    .select("_id fullName role")
    .sort({ fullName: 1 })
    .lean();

  const teacherIds = staff.filter((item) => item.role === "TEACHER").map((item) => item._id);
  const profiles = await TeacherProfile.find({ teacherId: { $in: teacherIds }, isDeleted: false })
    .select("teacherId salary branch designation")
    .lean();
  const profileMap = new Map(profiles.map((profile) => [profile.teacherId.toString(), profile]));

  return staff.map((item) => {
    const profile = profileMap.get(item._id.toString());
    return {
      ...item,
      salary: profile?.salary ?? null,
      branch: profile?.branch || "",
      campus: profile?.branch || "",
      designation: profile?.designation || item.role,
      department: roleToDepartment(item.role),
      employeeCode: toEmployeeCode(item._id),
    };
  });
};

export const createPayroll = async (payload, actorId) => {
  const { staffId, month, year, basicSalary, paySalary, allowances, deductions, bonus, paymentMethod, remarks, transactionRef } =
    payload;

  if (!staffId || !month || !year) {
    throw new ApiError(400, "staffId, month and year are required");
  }

  const staff = await User.findOne({ _id: staffId, isDeleted: false });
  if (!staff) throw new ApiError(404, "Staff not found");

  const profile = staff.role === "TEACHER"
    ? await TeacherProfile.findOne({ teacherId: staffId, isDeleted: false }).select("salary branch designation").lean()
    : null;
  const monthlyBasicSalary = Number(basicSalary || profile?.salary || 0);
  const salaryToPay = Number(paySalary || 0);

  if (monthlyBasicSalary <= 0) throw new ApiError(400, "Basic salary is required");
  if (salaryToPay <= 0) throw new ApiError(400, "Pay salary is required");

  const previousPaid = await Payroll.aggregate([
    { $match: { staffId: staff._id, month: month.trim(), year: Number(year), status: "PAID", isDeleted: false } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$paySalary", "$netSalary"] } } } },
  ]);
  const alreadyPaid = Number(previousPaid[0]?.total || 0);

  const netSalary = calcNet(salaryToPay, allowances, deductions, bonus);
  if (alreadyPaid + netSalary > monthlyBasicSalary) {
    throw new ApiError(400, `Remaining salary is ${Math.max(monthlyBasicSalary - alreadyPaid, 0)}`);
  }

  return Payroll.create({
    staffId,
    staffName: staff.fullName,
    staffRole: staff.role,
    month: month.trim(),
    year: Number(year),
    basicSalary: monthlyBasicSalary,
    paySalary: salaryToPay,
    allowances: Number(allowances || 0),
    deductions: Number(deductions || 0),
    bonus: Number(bonus || 0),
    netSalary,
    paymentMethod: paymentMethod || "BANK",
    transactionRef: String(transactionRef || "").trim(),
    campus: profile?.branch || payload.campus || "",
    department: roleToDepartment(staff.role),
    designation: profile?.designation || staff.role,
    employeeCode: toEmployeeCode(staff._id),
    remarks: remarks?.trim() || "",
    processedBy: actorId,
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updatePayroll = async (id, payload, actorId) => {
  const item = await Payroll.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Payroll record not found");

  ["basicSalary", "paySalary", "allowances", "deductions", "bonus", "paymentMethod", "remarks", "month", "year", "transactionRef"].forEach(
    (k) => {
      if (payload[k] !== undefined) item[k] = k === "year" ? Number(payload[k]) : payload[k];
    }
  );

  item.netSalary = calcNet(item.paySalary || item.basicSalary, item.allowances, item.deductions, item.bonus);
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const markPayrollPaid = async (id, actorId) => {
  const item = await Payroll.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Payroll record not found");

  item.status = "PAID";
  item.paidAt = new Date();
  if (!item.payslipNo) item.payslipNo = genPayslipNo();
  item.updatedBy = actorId;
  await item.save();
  return item;
};

export const deletePayroll = async (id, actorId) => {
  const item = await Payroll.findById(id);
  if (!item || item.isDeleted) throw new ApiError(404, "Payroll record not found");
  item.isDeleted = true;
  item.updatedBy = actorId;
  await item.save();
  return { id };
};

export const getPayrollDashboard = async () => {
  const now = new Date();
  const currentMonth = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  const [staffCount, allPayroll, staffOptions] = await Promise.all([
    User.countDocuments({ role: { $in: ["TEACHER", "ACCOUNTANT"] }, isDeleted: false, isActive: true }),
    Payroll.find({ isDeleted: false }).lean(),
    getStaffOptions(),
  ]);

  const enriched = enrichPayrollItems(allPayroll);
  const groups = new Map();
  enriched.forEach((item) => {
    const key = getPayrollKey(item);
    if (!groups.has(key)) groups.set(key, item);
  });
  const uniqueGroups = [...groups.values()];

  const paidRows = allPayroll.filter((row) => row.status === "PAID");
  const pendingGroups = uniqueGroups.filter((row) => row.displayStatus === "PENDING" || row.displayStatus === "PARTIAL");
  const paidGroups = uniqueGroups.filter((row) => row.displayStatus === "PAID");

  const paidThisMonth = paidRows
    .filter((row) => row.month === currentMonth && Number(row.year) === currentYear)
    .reduce((sum, row) => sum + Number(row.netSalary || 0), 0);

  const paidThisYear = paidRows
    .filter((row) => Number(row.year) === currentYear)
    .reduce((sum, row) => sum + Number(row.netSalary || 0), 0);

  const totalSalaryPaid = paidRows.reduce((sum, row) => sum + Number(row.netSalary || 0), 0);
  const totalPendingSalary = pendingGroups.reduce((sum, row) => sum + Number(row.remainingSalary || 0), 0);
  const totalMonthlyPayroll = staffOptions.reduce((sum, row) => sum + Number(row.salary || 0), 0);
  const averageMonthlySalary = staffCount > 0 ? totalMonthlyPayroll / staffCount : 0;

  const processedThisMonth = uniqueGroups.filter(
    (row) => row.month === currentMonth && Number(row.year) === currentYear
  ).length;

  const upcomingDue = pendingGroups
    .slice()
    .sort((a, b) => Number(a.year) - Number(b.year) || monthIndex(a.month) - monthIndex(b.month))
    .slice(0, 8)
    .map((row) => ({
      staffName: row.staffName,
      employeeCode: row.employeeCode,
      month: row.month,
      year: row.year,
      amount: row.remainingSalary,
      status: row.displayStatus,
    }));

  return {
    totalSchoolStaff: staffCount,
    totalMonthlyPayroll,
    totalSalaryPaid,
    totalPendingSalary,
    totalPayrollProcessedThisMonth: processedThisMonth,
    totalEmployeesPaid: new Set(paidGroups.map((row) => String(row.staffId))).size,
    totalEmployeesPending: new Set(pendingGroups.map((row) => String(row.staffId))).size,
    averageMonthlySalary,
    upcomingSalaryPayments: upcomingDue.length,
    upcomingPayments: upcomingDue,
    payrollThisYear: paidThisYear,
    salaryPaidThisMonth: paidThisMonth,
    salaryPaidThisYear: paidThisYear,
    outstandingSalary: totalPendingSalary,
    totalPayrollExpense: totalSalaryPaid,
  };
};

export const getPayrollAnalytics = async (query = {}) => {
  const filter = { isDeleted: false };
  if (query.year) filter.year = Number(query.year);
  if (query.campus) filter.campus = query.campus;

  const rows = await Payroll.find(filter).lean();
  const withMeta = await attachStaffMeta(rows);
  const enriched = enrichPayrollItems(withMeta);

  const byEmployee = {};
  const byDepartment = {};
  const byCampus = {};
  const byMonth = {};

  enriched.forEach((row) => {
    const empKey = String(row.staffId);
    if (!byEmployee[empKey]) {
      byEmployee[empKey] = {
        staffId: row.staffId,
        staffName: row.staffName,
        employeeCode: row.employeeCode,
        department: row.department,
        campus: row.campus,
        paid: 0,
        pending: 0,
      };
    }
    if (row.status === "PAID") byEmployee[empKey].paid += Number(row.netSalary || 0);
    else byEmployee[empKey].pending += Number(row.netSalary || 0);

    const dept = row.department || "Staff";
    if (!byDepartment[dept]) byDepartment[dept] = { department: dept, paid: 0, pending: 0, total: 0 };
    if (row.status === "PAID") byDepartment[dept].paid += Number(row.netSalary || 0);
    else byDepartment[dept].pending += Number(row.netSalary || 0);
    byDepartment[dept].total = byDepartment[dept].paid + byDepartment[dept].pending;

    const campus = row.campus || "Unassigned";
    if (!byCampus[campus]) byCampus[campus] = { campus, paid: 0, pending: 0, total: 0 };
    if (row.status === "PAID") byCampus[campus].paid += Number(row.netSalary || 0);
    else byCampus[campus].pending += Number(row.netSalary || 0);
    byCampus[campus].total = byCampus[campus].paid + byCampus[campus].pending;

    const monthKey = `${row.month} ${row.year}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { label: monthKey, month: row.month, year: row.year, paid: 0, pending: 0 };
    if (row.status === "PAID") byMonth[monthKey].paid += Number(row.netSalary || 0);
    else byMonth[monthKey].pending += Number(row.netSalary || 0);
  });

  const monthlyTrend = Object.values(byMonth).sort(
    (a, b) => Number(a.year) - Number(b.year) || monthIndex(a.month) - monthIndex(b.month)
  );

  return {
    employeeSummary: Object.values(byEmployee).sort((a, b) => b.paid - a.paid),
    departmentSummary: Object.values(byDepartment).sort((a, b) => b.total - a.total),
    campusSummary: Object.values(byCampus).sort((a, b) => b.total - a.total),
    monthlyTrend,
    salaryDistributionByDepartment: Object.values(byDepartment).map((row) => ({
      department: row.department,
      amount: row.paid,
      share: row.total,
    })),
  };
};

export const getPayrollReportData = async (query = {}) => {
  const type = String(query.type || "summary").toLowerCase();
  const list = await listPayroll({ ...query, page: 1, limit: 100 });
  const dashboard = await getPayrollDashboard();
  const analytics = await getPayrollAnalytics(query);

  if (type === "pending") {
    return {
      type,
      rows: list.items.filter((row) => row.displayStatus === "PENDING" || row.displayStatus === "PARTIAL"),
      summary: { outstandingSalary: dashboard.outstandingSalary },
    };
  }
  if (type === "paid") {
    return {
      type,
      rows: list.items.filter((row) => row.status === "PAID"),
      summary: { totalSalaryPaid: dashboard.totalSalaryPaid },
    };
  }
  if (type === "monthly") {
    return { type, rows: analytics.monthlyTrend, summary: dashboard };
  }
  if (type === "department") {
    return { type, rows: analytics.departmentSummary, summary: dashboard };
  }
  if (type === "campus") {
    return { type, rows: analytics.campusSummary, summary: dashboard };
  }
  if (type === "employee") {
    return { type, rows: analytics.employeeSummary, summary: dashboard };
  }

  return {
    type: "summary",
    rows: list.items,
    summary: dashboard,
    analytics,
  };
};
