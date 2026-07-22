import { SchoolPurchase } from "../../models/SchoolPurchase.js";
import { AssetInventory } from "../../models/AssetInventory.js";
import { getAssetCategoryLabel } from "../../constants/assetCategories.js";
import { ApiError } from "../../utils/apiError.js";

const PURCHASE_TYPES = ["BROKEN_REPLACEMENT", "NEW_EXTRA"];

const genPurchaseNo = () => `PUR-${Date.now()}`;

const parsePage = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 500);
  return { page, limit, search: (query.search || "").trim(), skip: (page - 1) * limit };
};

const normalizeBranch = (value) => (value === "Girls" ? "Girls" : "Boys");

const normalizePurchaseType = (value) =>
  PURCHASE_TYPES.includes(value) ? value : "NEW_EXTRA";

const dateRange = (from, to) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const syncLocation = async (purchase, location, actorId) => {
  const quantity = Math.max(Number(purchase.quantity || 0), 0);
  if (!quantity) return;

  const purchaseType = normalizePurchaseType(purchase.purchaseType);
  const filter = {
    branch: location.branch,
    className: location.className,
    section: location.section,
    category: purchase.category,
    isDeleted: false,
  };

  let inventory = await AssetInventory.findOne(filter);
  if (!inventory) {
    inventory = new AssetInventory({
      ...filter,
      working: 0,
      broken: 0,
      underMaintenance: 0,
      missing: 0,
      replaced: 0,
      totalPurchased: 0,
      createdBy: actorId,
    });
  }

  inventory.working = Number(inventory.working || 0) + quantity;
  inventory.totalPurchased = Number(inventory.totalPurchased || 0) + quantity;

  if (purchaseType === "BROKEN_REPLACEMENT") {
    const broken = Number(inventory.broken || 0);
    const reduceBy = Math.min(broken, quantity);
    inventory.broken = broken - reduceBy;
    inventory.replaced = Number(inventory.replaced || 0) + reduceBy;
  }

  inventory.itemName = purchase.itemName || getAssetCategoryLabel(purchase.category);
  inventory.lastPurchaseDate = purchase.date;
  inventory.lastPurchaseId = purchase._id;
  inventory.updatedBy = actorId;
  await inventory.save();
};

export const syncPurchaseToAssets = async (purchase, actorId) => {
  const branch = normalizeBranch(purchase.branch);
  const className = String(purchase.className || "").trim();
  const section = String(purchase.section || "").trim() || "A";
  const quantity = Math.max(Number(purchase.quantity || 0), 0);
  if (!quantity) return;

  const locations = className
    ? [{ branch, className, section }]
    : [{ branch, className: "", section: "" }];

  for (const location of locations) {
    await syncLocation(purchase, location, actorId);
  }

  purchase.syncedToAssets = true;
  purchase.updatedBy = actorId;
  await purchase.save();
};

export const listPurchases = async (query) => {
  const { page, limit, search, skip } = parsePage(query);
  const filter = { isDeleted: false };
  if (query.branch) filter.branch = normalizeBranch(query.branch);
  if (query.category) filter.category = query.category;
  if (query.className) filter.className = query.className;
  if (query.section) filter.section = query.section;
  if (query.purchaseType) filter.purchaseType = normalizePurchaseType(query.purchaseType);

  const range = dateRange(query.from, query.to);
  if (range) filter.date = range;

  if (search) {
    filter.$or = [
      { purchaseNo: { $regex: search, $options: "i" } },
      { itemName: { $regex: search, $options: "i" } },
      { vendor: { $regex: search, $options: "i" } },
      { className: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    SchoolPurchase.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    SchoolPurchase.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
};

export const createPurchase = async (payload, actorId) => {
  const quantity = Math.max(Number(payload.quantity || 0), 0);
  const unitCost = Math.max(Number(payload.unitCost || 0), 0);
  if (!quantity) {
    throw new ApiError(400, "quantity is required");
  }
  if (!payload.category) {
    throw new ApiError(400, "category is required");
  }

  const purchaseType = normalizePurchaseType(payload.purchaseType);
  const itemName = String(payload.itemName || "").trim() || getAssetCategoryLabel(payload.category);

  const purchase = await SchoolPurchase.create({
    purchaseNo: genPurchaseNo(),
    date: payload.date ? new Date(payload.date) : new Date(),
    branch: normalizeBranch(payload.branch),
    className: String(payload.className || "").trim(),
    section: String(payload.section || "").trim(),
    category: payload.category,
    purchaseType,
    itemName,
    vendor: String(payload.vendor || "").trim(),
    quantity,
    unitCost,
    totalAmount: quantity * unitCost,
    notes: String(payload.notes || "").trim(),
    status: "APPROVED",
    createdBy: actorId,
    updatedBy: actorId,
  });

  await syncPurchaseToAssets(purchase, actorId);
  return purchase;
};

export const getPurchase = async (id) => {
  const item = await SchoolPurchase.findOne({ _id: id, isDeleted: false }).lean();
  if (!item) throw new ApiError(404, "Purchase not found");
  return item;
};

export const summarizePurchases = async (query = {}) => {
  const filter = { isDeleted: false, status: "APPROVED" };
  if (query.branch) filter.branch = normalizeBranch(query.branch);
  const range = dateRange(query.from, query.to);
  if (range) filter.date = range;

  const items = await SchoolPurchase.find(filter).select("category quantity totalAmount").lean();
  return items.reduce(
    (summary, item) => {
      const quantity = Number(item.quantity || 0);
      const total = Number(item.totalAmount || 0);
      if (item.category === "DESKS") summary.desks += quantity;
      if (item.category === "BENCHES_CHAIRS" || item.category === "BENCHES" || item.category === "CHAIRS") {
        summary.benchesChairs += quantity;
      }
      if (item.category === "BULBS") summary.bulbs += quantity;
      if (item.category === "FANS") summary.fans += quantity;
      summary.totalAmount += total;
      summary.totalItems += quantity;
      return summary;
    },
    { desks: 0, benchesChairs: 0, bulbs: 0, fans: 0, totalAmount: 0, totalItems: 0 }
  );
};
