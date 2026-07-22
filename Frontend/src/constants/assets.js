export const ASSET_CATEGORIES = [
  { value: "DESKS", label: "Desks" },
  { value: "TABLES", label: "Tables" },
  { value: "CHAIRS", label: "Chairs" },
  { value: "BENCHES", label: "Benches" },
  { value: "BENCHES_CHAIRS", label: "Benches & Chairs" },
  { value: "TEACHER_TABLES", label: "Teacher Tables" },
  { value: "TEACHER_CHAIRS", label: "Teacher Chairs" },
  { value: "WHITE_BOARDS", label: "White Boards" },
  { value: "BLACK_BOARDS", label: "Black Boards" },
  { value: "FANS", label: "Fans" },
  { value: "BULBS", label: "Bulbs" },
  { value: "TUBE_LIGHTS", label: "Tube Lights" },
  { value: "AIR_CONDITIONERS", label: "Air Conditioners" },
  { value: "PROJECTORS", label: "Projectors" },
  { value: "COMPUTERS", label: "Computers" },
  { value: "PRINTERS", label: "Printers" },
  { value: "WATER_COOLERS", label: "Water Coolers" },
  { value: "CCTV_CAMERAS", label: "CCTV Cameras" },
  { value: "UPS", label: "UPS" },
  { value: "GENERATORS", label: "Generators" },
  { value: "LAB_EQUIPMENT", label: "Laboratory Equipment" },
  { value: "LIBRARY_FURNITURE", label: "Library Furniture" },
  { value: "OFFICE_FURNITURE", label: "Office Furniture" },
  { value: "OTHER", label: "Other" },
];

export const PURCHASE_CATEGORIES = ASSET_CATEGORIES;

export const PURCHASE_TYPE_OPTIONS = [
  { value: "BROKEN_REPLACEMENT", label: "Broken Replacement" },
  { value: "NEW_EXTRA", label: "New/Extra Purchase" },
];

export const ASSET_STATUS_OPTIONS = [
  { value: "WORKING", label: "Working" },
  { value: "BROKEN", label: "Broken" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "MISSING", label: "Missing" },
  { value: "REPLACED", label: "Replaced" },
];

export const CAMPUS_OPTIONS = [
  { value: "Boys", label: "Boys Campus" },
  { value: "Girls", label: "Girls Campus" },
];

export const REPORT_TYPES = [
  { value: "inventory", label: "Total Inventory Report" },
  { value: "campus", label: "Campus-wise Asset Report" },
  { value: "class", label: "Class-wise Asset Report" },
  { value: "section", label: "Section-wise Asset Report" },
  { value: "category", label: "Category-wise Asset Report" },
  { value: "broken", label: "Broken Assets Report" },
  { value: "maintenance", label: "Maintenance Report" },
  { value: "new-purchases", label: "Newly Purchased Assets Report" },
];

export const getAssetCategoryLabel = (value) =>
  ASSET_CATEGORIES.find((item) => item.value === value)?.label || value;

export const getPurchaseCategoryLabel = getAssetCategoryLabel;
