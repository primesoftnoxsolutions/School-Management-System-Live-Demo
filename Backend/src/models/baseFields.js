export const baseFields = {
  createdBy: { type: String, default: null },
  updatedBy: { type: String, default: null },
  isDeleted: { type: Boolean, default: false, index: true },
};
