import { useEffect, useRef, useState } from "react";
import { DropdownBackdrop, DropdownMenuPortal } from "../ui/DropdownBackdrop";

export default function SubjectManager({
  label = "Subjects (multiple)",
  subjects = [],
  selected = [],
  onSubjectsChange,
  onSelectedChange,
  placeholder = "Select subjects",
  dark = false,
  menuMaxHeight = 220,
}) {
  const [newSubject, setNewSubject] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = () => {
    setOpen(false);
    setEditingSubject(null);
  };

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const maxHeight = Math.min(menuMaxHeight, Math.max(rect.top - 12, 140));
    setMenuStyle({
      left: rect.left,
      width: rect.width,
      bottom: window.innerHeight - rect.top + 4,
      maxHeight,
    });
  };

  useEffect(() => {
    const onDocClick = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, subjects.length, menuMaxHeight]);

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjects.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setNewSubject("");
      return;
    }
    onSubjectsChange([...subjects, trimmed]);
    if (!selected.includes(trimmed)) {
      onSelectedChange([...selected, trimmed]);
    }
    setNewSubject("");
  };

  const removeSubject = (subject) => {
    onSubjectsChange(subjects.filter((item) => item !== subject));
    onSelectedChange(selected.filter((item) => item !== subject));
  };

  const startRename = (subject) => {
    setEditingSubject(subject);
    setEditValue(subject);
  };

  const saveRename = () => {
    const trimmed = editValue.trim();
    if (!trimmed || !editingSubject) {
      setEditingSubject(null);
      return;
    }
    if (subjects.some((item) => item !== editingSubject && item.toLowerCase() === trimmed.toLowerCase())) {
      setEditingSubject(null);
      return;
    }
    onSubjectsChange(subjects.map((item) => (item === editingSubject ? trimmed : item)));
    onSelectedChange(selected.map((item) => (item === editingSubject ? trimmed : item)));
    setEditingSubject(null);
    setEditValue("");
  };

  const toggleSelected = (subject) => {
    if (selected.includes(subject)) {
      onSelectedChange(selected.filter((item) => item !== subject));
    } else {
      onSelectedChange([...selected, subject]);
    }
  };

  const summary = selected.length ? selected.join(", ") : placeholder;

  const triggerClass = dark
    ? "flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-[#1a1b26] px-3 py-2.5 text-left text-sm outline-none transition hover:border-[#7c4dff]/30 focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
    : "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm outline-none transition hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  const inputClass = dark
    ? "min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#0b0c15] px-3 py-2 text-sm text-white outline-none placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
    : "min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <div ref={rootRef} className="space-y-2">
      {label ? (
        <p className={`text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>{label}</p>
      ) : null}

      <div className="relative">
        <button ref={triggerRef} type="button" onClick={() => setOpen((prev) => !prev)} className={triggerClass}>
          <span
            className={`min-w-0 flex-1 truncate ${
              selected.length ? (dark ? "text-white" : "text-slate-800") : dark ? "text-[#9e9e9e]" : "text-slate-400"
            }`}
            title={selected.length ? summary : undefined}
          >
            {summary}
          </span>
          <span className={`shrink-0 ${dark ? "text-[#9e9e9e]" : "text-slate-400"}`}>{open ? "▲" : "▼"}</span>
        </button>

        {open ? (
          <>
            <DropdownBackdrop onClose={closeMenu} />
            <DropdownMenuPortal menuRef={menuRef} style={menuStyle} dark={dark}>
            <div className="flex h-full flex-col" style={{ maxHeight: menuStyle.maxHeight }}>
              <div className={`shrink-0 border-b p-2 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Add new subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                  />
                  <button
                    type="button"
                    onClick={addSubject}
                    className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-white ${
                      dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectedChange([])}
                    disabled={!selected.length}
                    className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                      dark ? "text-[#9e9e9e] hover:bg-white/[0.04]" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-1">
                {subjects.length ? (
                  subjects.map((subject) => {
                    const isEditing = editingSubject === subject;
                    const isSelected = selected.includes(subject);
                    return (
                      <div
                        key={subject}
                        className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-2 last:mb-0 ${
                          isSelected
                            ? dark
                              ? "bg-[#7c4dff]/20"
                              : "bg-indigo-50"
                            : dark
                              ? "hover:bg-white/[0.04]"
                              : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(subject)}
                          className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 accent-indigo-600"
                        />
                        {isEditing ? (
                          <input
                            className={`min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm outline-none ${
                              dark
                                ? "border-white/[0.06] bg-[#0b0c15] text-white focus:border-[#7c4dff]/40"
                                : "border-slate-200 focus:border-indigo-400"
                            }`}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveRename();
                              }
                              if (e.key === "Escape") setEditingSubject(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className={`min-w-0 flex-1 truncate text-sm ${dark ? "text-white" : "text-slate-700"}`}>
                            {subject}
                          </span>
                        )}
                        <div className="flex shrink-0 items-center gap-0.5">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={saveRename}
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                dark ? "text-[#7c4dff] hover:bg-white/[0.04]" : "text-indigo-600 hover:bg-indigo-100"
                              }`}
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startRename(subject)}
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                dark ? "text-[#9e9e9e] hover:bg-white/[0.04]" : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              Rename
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSubject(subject)}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              dark ? "text-[#e91e63] hover:bg-white/[0.04]" : "text-rose-600 hover:bg-rose-50"
                            }`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={`px-3 py-4 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No subjects yet. Add one above.
                  </p>
                )}
              </div>
            </div>
            </DropdownMenuPortal>
          </>
        ) : null}
      </div>
    </div>
  );
}
