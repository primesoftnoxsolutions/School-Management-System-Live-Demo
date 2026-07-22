function ProfileField({ label, value, dark = false, className = "" }) {
  return (
    <div className={className}>
      <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className={`font-medium ${dark ? "text-white" : "text-slate-800"}`}>{value || "-"}</p>
    </div>
  );
}

function InlineEditableField({
  label,
  value,
  dark = false,
  className = "",
  editing = false,
  multiline = false,
  placeholder = "",
  onStartEdit,
  onChange,
  onCommit,
  onCancel,
}) {
  const labelClass = `text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`;
  const displayClass = `mt-1 w-full rounded-xl border border-transparent px-3 py-2 text-left font-medium transition ${
    dark
      ? "text-white hover:border-white/[0.06] hover:bg-white/[0.03] focus-visible:border-[#7c4dff]/30 focus-visible:bg-white/[0.03]"
      : "text-slate-800 hover:border-slate-200 hover:bg-slate-50 focus-visible:border-indigo-200 focus-visible:bg-slate-50"
  }`;
  const inputClass = dark
    ? "w-full rounded-xl border border-white/[0.06] bg-[#1a1b26] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
    : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <div className={className}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${labelClass}`}>{label}</p>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={3}
            value={value || ""}
            placeholder={placeholder}
            className={`mt-1 w-full resize-none ${inputClass}`}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={() => onCommit?.()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancel?.();
              }
              if ((e.key === "Enter" && (e.ctrlKey || e.metaKey)) || e.key === "Tab") {
                onCommit?.();
              }
            }}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={value || ""}
            placeholder={placeholder}
            className={`mt-1 ${inputClass}`}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={() => onCommit?.()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onCancel?.();
              }
              if (e.key === "Enter") {
                onCommit?.();
              }
            }}
          />
        )
      ) : (
        <button type="button" className={displayClass} onClick={onStartEdit}>
          {value || "-"}
        </button>
      )}
    </div>
  );
}

export function StudentProfileHeaderMeta({
  student,
  dark = false,
  editingField = null,
  onStartEdit,
  onChangeField,
  onCommitField,
  onCancelField,
}) {
  return (
    <div
      className={`mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2 ${
        dark ? "border-white/[0.06]" : "border-slate-100"
      }`}
    >
      <ProfileField label="Student CNIC" value={student?.cnicBForm} dark={dark} />
      <InlineEditableField
        label="Student Mobile"
        value={student?.phoneNumber}
        dark={dark}
        editing={editingField === "phoneNumber"}
        placeholder="Enter student mobile"
        onStartEdit={() => onStartEdit?.("phoneNumber")}
        onChange={(value) => onChangeField?.("phoneNumber", value)}
        onCommit={() => onCommitField?.("phoneNumber")}
        onCancel={() => onCancelField?.("phoneNumber")}
      />
    </div>
  );
}

export default function StudentProfileDetails({
  student,
  dark = false,
  editingField = null,
  onStartEdit,
  onChangeField,
  onCommitField,
  onCancelField,
}) {
  if (!student) return null;

  const subjects = (student.subjects || []).length ? student.subjects.join(", ") : "-";
  const dateOfBirth = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-";
  const admissionDate = student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : "-";

  return (
    <div className="modal-body-enter space-y-4 px-6 py-5 text-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ProfileField label="Class" value={student.className} dark={dark} />
        <ProfileField label="Section" value={student.section || "A"} dark={dark} />
        <ProfileField label="Roll No#" value={student.rollNumber} dark={dark} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileField label="Father Name" value={student.fatherName || student.guardianName} dark={dark} />
        <ProfileField label="Father CNIC" value={student.fatherCnic} dark={dark} />
        <InlineEditableField
          label="Call Number"
          value={student.guardianPhone}
          dark={dark}
          editing={editingField === "guardianPhone"}
          placeholder="Enter call number"
          onStartEdit={() => onStartEdit?.("guardianPhone")}
          onChange={(value) => onChangeField?.("guardianPhone", value)}
          onCommit={() => onCommitField?.("guardianPhone")}
          onCancel={() => onCancelField?.("guardianPhone")}
        />
        <InlineEditableField
          label="WhatsApp Number"
          value={student.alternativePhone}
          dark={dark}
          editing={editingField === "alternativePhone"}
          placeholder="Optional WhatsApp number"
          onStartEdit={() => onStartEdit?.("alternativePhone")}
          onChange={(value) => onChangeField?.("alternativePhone", value)}
          onCommit={() => onCommitField?.("alternativePhone")}
          onCancel={() => onCancelField?.("alternativePhone")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ProfileField label="Gender" value={student.gender} dark={dark} />
        <ProfileField label="Date of Birth" value={dateOfBirth} dark={dark} />
        <ProfileField label="Admission Date" value={admissionDate} dark={dark} />
      </div>

      <ProfileField label="Subjects" value={subjects} dark={dark} />
      <InlineEditableField
        label="Address"
        value={student.address}
        dark={dark}
        editing={editingField === "address"}
        multiline
        placeholder="Enter address"
        onStartEdit={() => onStartEdit?.("address")}
        onChange={(value) => onChangeField?.("address", value)}
        onCommit={() => onCommitField?.("address")}
        onCancel={() => onCancelField?.("address")}
      />
    </div>
  );
}
