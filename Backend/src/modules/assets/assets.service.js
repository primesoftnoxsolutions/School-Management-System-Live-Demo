import { AssetInventory } from "../../models/AssetInventory.js";
import { SchoolPurchase } from "../../models/SchoolPurchase.js";
import { ApiError } from "../../utils/apiError.js";

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 2000);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

const normalizeBranch = (value) => (value === "Girls" ? "Girls" : "Boys");

const statusFieldMap = {
  WORKING: "working",
  BROKEN: "broken",
  UNDER_MAINTENANCE: "underMaintenance",
  MISSING: "missing",
  REPLACED: "replaced",
};

const sumField = (rows, field) => rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);

const totalUnits = (row) =>
  Number(row.working || 0) +
  Number(row.broken || 0) +
  Number(row.underMaintenance || 0) +
  Number(row.missing || 0) +
  Number(row.replaced || 0);

const buildInventoryFilter = (query = {}) => {
  const filter = { isDeleted: false };
  if (query.branch) filter.branch = normalizeBranch(query.branch);
  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section;
  if (query.category) filter.category = query.category;

  if (query.status && statusFieldMap[query.status]) {
    filter[statusFieldMap[query.status]] = { $gt: 0 };
  }

  if (query.search) {
    filter.$or = [
      { itemName: { $regex: query.search, $options: "i" } },
      { className: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
      { remarks: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
};

const mapInventoryRow = (row) => ({
  ...row,
  totalUnits: totalUnits(row),
  functionalUnits: Number(row.working || 0),
});

export const listAssets = async (query) => {
  const { page, limit, skip } = parsePage(query);
  const filter = buildInventoryFilter(query);

  const [items, total] = await Promise.all([
    AssetInventory.find(filter).sort({ className: 1, section: 1, category: 1 }).skip(skip).limit(limit).lean(),
    AssetInventory.countDocuments(filter),
  ]);

  return {
    items: items.map(mapInventoryRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getAssetSummary = async (query = {}) => {
  const filter = { isDeleted: false };
  if (query.branch) filter.branch = normalizeBranch(query.branch);

  const rows = await AssetInventory.find(filter).lean();

  const categoryCount = (categories, field = "working") =>
    rows
      .filter((row) => categories.includes(row.category))
      .reduce((sum, row) => sum + Number(row[field] || 0), 0);

  const desksCategories = ["DESKS"];
  const benchesChairsCategories = ["BENCHES", "CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"];
  const bulbsCategories = ["BULBS"];
  const fansCategories = ["FANS"];

  return {
    totalDesks: categoryCount(desksCategories, "working"),
    brokenDesks: categoryCount(desksCategories, "broken"),
    totalBenches: categoryCount(["BENCHES", "BENCHES_CHAIRS"], "working"),
    totalChairs: categoryCount(["CHAIRS", "BENCHES_CHAIRS", "TEACHER_CHAIRS"], "working"),
    totalBenchesChairs: categoryCount(benchesChairsCategories, "working"),
    brokenBenchesChairs: categoryCount(benchesChairsCategories, "broken"),
    totalTables: categoryCount(["TABLES", "TEACHER_TABLES"], "working"),
    totalFans: categoryCount(fansCategories, "working"),
    brokenFans: categoryCount(fansCategories, "broken"),
    totalBulbs: categoryCount(bulbsCategories, "working"),
    brokenBulbs: categoryCount(bulbsCategories, "broken"),
    totalBrokenAssets: sumField(rows, "broken"),
  };
};

export const getClassroomAssets = async (query = {}) => {
  if (!query.className) throw new ApiError(400, "className is required");

  const filter = buildInventoryFilter({
    ...query,
    className: query.className,
    section: query.section || "A",
  });

  const rows = await AssetInventory.find(filter).sort({ category: 1 }).lean();
  return {
    className: query.className,
    section: query.section || "A",
    branch: query.branch ? normalizeBranch(query.branch) : undefined,
    items: rows.map(mapInventoryRow),
    totals: rows.reduce(
      (acc, row) => {
        acc.working += Number(row.working || 0);
        acc.broken += Number(row.broken || 0);
        acc.underMaintenance += Number(row.underMaintenance || 0);
        acc.missing += Number(row.missing || 0);
        acc.replaced += Number(row.replaced || 0);
        acc.total += totalUnits(row);
        return acc;
      },
      { working: 0, broken: 0, underMaintenance: 0, missing: 0, replaced: 0, total: 0 }
    ),
  };
};

export const adjustAssetStatus = async (id, payload, actorId) => {
  const item = await AssetInventory.findOne({ _id: id, isDeleted: false });
  if (!item) throw new ApiError(404, "Asset inventory record not found");

  const fromStatus = String(payload.fromStatus || "").toUpperCase();
  const toStatus = String(payload.toStatus || "").toUpperCase();
  const quantity = Math.max(Number(payload.quantity || 0), 0);

  if (!statusFieldMap[fromStatus] || !statusFieldMap[toStatus]) {
    throw new ApiError(400, "Valid fromStatus and toStatus are required");
  }
  if (!quantity) throw new ApiError(400, "quantity must be greater than 0");
  if (fromStatus === toStatus) throw new ApiError(400, "fromStatus and toStatus must be different");

  const fromField = statusFieldMap[fromStatus];
  const toField = statusFieldMap[toStatus];
  if (Number(item[fromField] || 0) < quantity) {
    throw new ApiError(400, `Only ${item[fromField]} units available in ${fromStatus}`);
  }

  item[fromField] = Number(item[fromField] || 0) - quantity;
  item[toField] = Number(item[toField] || 0) + quantity;
  if (payload.remarks !== undefined) item.remarks = String(payload.remarks || "").trim();
  item.updatedBy = actorId;
  await item.save();

  return mapInventoryRow(item.toObject());
};

export const updateAssetInventory = async (id, payload, actorId) => {
  const item = await AssetInventory.findOne({ _id: id, isDeleted: false });
  if (!item) throw new ApiError(404, "Asset inventory record not found");

  ["working", "broken", "underMaintenance", "missing", "replaced"].forEach((field) => {
    if (payload[field] !== undefined) item[field] = Math.max(Number(payload[field] || 0), 0);
  });
  if (payload.remarks !== undefined) item.remarks = String(payload.remarks || "").trim();
  item.updatedBy = actorId;
  await item.save();
  return mapInventoryRow(item.toObject());
};

export const getAssetReport = async (query = {}) => {
  const type = String(query.type || "inventory").toLowerCase();
  const filter = buildInventoryFilter(query);
  const rows = await AssetInventory.find(filter).sort({ branch: 1, className: 1, section: 1, category: 1 }).lean();

  if (type === "campus") {
    const grouped = rows.reduce((acc, row) => {
      const key = row.branch;
      if (!acc[key]) acc[key] = { campus: key, total: 0, working: 0, broken: 0, underMaintenance: 0 };
      acc[key].total += totalUnits(row);
      acc[key].working += Number(row.working || 0);
      acc[key].broken += Number(row.broken || 0);
      acc[key].underMaintenance += Number(row.underMaintenance || 0);
      return acc;
    }, {});
    return { type, rows: Object.values(grouped) };
  }

  if (type === "class") {
    const grouped = rows
      .filter((row) => row.className)
      .reduce((acc, row) => {
        const key = `${row.branch}|${row.className}`;
        if (!acc[key]) acc[key] = { campus: row.branch, className: row.className, total: 0, working: 0, broken: 0 };
        acc[key].total += totalUnits(row);
        acc[key].working += Number(row.working || 0);
        acc[key].broken += Number(row.broken || 0);
        return acc;
      }, {});
    return { type, rows: Object.values(grouped) };
  }

  if (type === "section") {
    const grouped = rows
      .filter((row) => row.className)
      .reduce((acc, row) => {
        const key = `${row.branch}|${row.className}|${row.section || "A"}`;
        if (!acc[key]) {
          acc[key] = { campus: row.branch, className: row.className, section: row.section || "A", total: 0, working: 0, broken: 0 };
        }
        acc[key].total += totalUnits(row);
        acc[key].working += Number(row.working || 0);
        acc[key].broken += Number(row.broken || 0);
        return acc;
      }, {});
    return { type, rows: Object.values(grouped) };
  }

  if (type === "category") {
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = { category: row.category, total: 0, working: 0, broken: 0 };
      acc[row.category].total += totalUnits(row);
      acc[row.category].working += Number(row.working || 0);
      acc[row.category].broken += Number(row.broken || 0);
      return acc;
    }, {});
    return { type, rows: Object.values(grouped) };
  }

  if (type === "broken") {
    return {
      type,
      rows: rows
        .filter((row) => Number(row.broken || 0) > 0)
        .map((row) => ({
          campus: row.branch,
          className: row.className || "Campus Store",
          section: row.section || "-",
          category: row.category,
          itemName: row.itemName,
          broken: row.broken,
        })),
    };
  }

  if (type === "maintenance") {
    return {
      type,
      rows: rows
        .filter((row) => Number(row.underMaintenance || 0) > 0)
        .map((row) => ({
          campus: row.branch,
          className: row.className || "Campus Store",
          section: row.section || "-",
          category: row.category,
          itemName: row.itemName,
          underMaintenance: row.underMaintenance,
        })),
    };
  }

  if (type === "new-purchases") {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const purchaseFilter = { isDeleted: false, status: "APPROVED", date: { $gte: since } };
    if (query.branch) purchaseFilter.branch = normalizeBranch(query.branch);
    const purchases = await SchoolPurchase.find(purchaseFilter).sort({ date: -1 }).lean();
    return {
      type,
      rows: purchases.map((row) => ({
        purchaseNo: row.purchaseNo,
        date: row.date,
        campus: row.branch,
        className: row.className || "Campus Store",
        section: row.section || "-",
        category: row.category,
        itemName: row.itemName,
        quantity: row.quantity,
        totalAmount: row.totalAmount,
      })),
    };
  }

  return {
    type: "inventory",
    rows: rows.map((row) => ({
      campus: row.branch,
      className: row.className || "Campus Store",
      section: row.section || "-",
      category: row.category,
      itemName: row.itemName,
      working: row.working,
      broken: row.broken,
      underMaintenance: row.underMaintenance,
      missing: row.missing,
      replaced: row.replaced,
      total: totalUnits(row),
    })),
  };
};
