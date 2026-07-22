export { PURCHASE_CATEGORIES, getPurchaseCategoryLabel } from "../constants/assets";

export const purchasesToCsv = (items = []) => {
  const rows = [
    [
      "Purchase No",
      "Date",
      "Campus",
      "Class",
      "Section",
      "Category",
      "Purchase Type",
      "Item",
      "Vendor",
      "Quantity",
      "Unit Cost",
      "Total Amount",
      "Notes",
    ],
    ...items.map((item) => [
      item.purchaseNo || item.id || "",
      item.date ? new Date(item.date).toLocaleDateString() : "",
      item.branch || "Boys",
      item.className || "",
      item.section || "",
      item.category || "",
      item.purchaseType || "NEW_EXTRA",
      item.itemName || "",
      item.vendor || "",
      item.quantity || 0,
      item.unitCost || 0,
      item.totalAmount || 0,
      item.notes || "",
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => String(value ?? "").replaceAll('"', '""'))
        .map((value) => `"${value}"`)
        .join(",")
    )
    .join("\n");
};
