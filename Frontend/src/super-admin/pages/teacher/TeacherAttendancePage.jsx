import { useEffect, useState } from "react";
import api from "../../services/api/client";
import FormModal from "../../components/ui/FormModal";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import TeacherAttendanceModal from "../../components/teachers/TeacherAttendanceModal";
import TeacherActivityMonitor from "../../components/teachers/TeacherActivityMonitor";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../../constants/classes";

const today = () => new Date().toISOString().slice(0, 10);

const TEACHER_STATUS_LABELS = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "On Leave",
  LATE: "Late",
  UNMARKED: "Not Marked",
};

const TEACHER_STATUS_BADGES = {
  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  LEAVE: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  UNMARKED: "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-[#9e9e9e]",
};

function toAttendanceDateValue(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function buildDateRange(from, to) {
  if (!from || !to) return [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toAttendanceDateValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function getTeacherAssignmentMatches(teacher, className, section) {
  const assignments = teacher?.assignedClasses || [];
  if (!assignments.length) return [];
  return assignments.filter((item) => {
    const matchesClass = !className || item.className === className;
    const matchesSection = !section || (item.section || "A") === section;
    return matchesClass && matchesSection;
  });
}

function getPrimaryTeacherAssignment(teacher, className, section) {
  const matches = getTeacherAssignmentMatches(teacher, className, section);
  const source = matches.length ? matches : teacher?.assignedClasses || [];
  if (!source.length) return { className: "Unassigned", section: "Ã¢â‚¬â€" };
  const first = source[0];
  return {
    className: first.className || "Unassigned",
    section: first.section || "A",
  };
}

const STATUS_BUTTONS = [
  { value: "PRESENT", label: "Present", active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "ABSENT", label: "Absent", active: "bg-rose-600 text-white border-rose-600" },
  { value: "LATE", label: "Late", active: "bg-amber-500 text-white border-amber-500" },
  { value: "LEAVE", label: "Leave", active: "bg-sky-600 text-white border-sky-600" },
];

export default function TeacherAttendancePage({ dark = false, onToggleTheme, branchSection = "" }) {
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [teachers, setTeachers] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyStats, setHistoryStats] = useState({ present: 0, absent: 0, leave: 0, late: 0, unmarked: 0 });
  const [students, setStudents] = useState([]);
  const [todayRecords, setTodayRecords] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showTeacherAttendanceModal, setShowTeacherAttendanceModal] = useState(false);
  const [teacherAttendanceDate, setTeacherAttendanceDate] = useState(() => toAttendanceDateValue());
  const [teacherAttendanceRefreshKey, setTeacherAttendanceRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [markingId, setMarkingId] = useState("");
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const attendanceClassNames = CLASS_OPTIONS.slice(0, 13);
  const selectedClass = selectedClassName
    ? {
        className: selectedClassName,
        section: selectedSection || "A",
      }
    : null;

  const cardClass = dark ? "rounded-2xl border border-white/[0.06] bg-[#161722]" : "ref-card";
  const tableHeadClass = dark ? "bg-[#1a1b26] text-left text-[#9e9e9e]" : "bg-slate-50 text-left text-slate-500";
  const tableCellClass = dark ? "text-white" : "text-slate-700";
  const mutedClass = dark ? "text-[#9e9e9e]" : "text-slate-500";
  const borderClass = dark ? "border-white/[0.06]" : "border-slate-100";
  const idleStatusClass = dark
    ? "border-white/[0.06] bg-[#161722] text-white hover:bg-white/[0.04]"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  const classSelectOptions = [
    { value: "", label: "Select All Classes" },
    ...attendanceClassNames.map((className) => ({ value: className, label: className })),
  ];
  const teacherSelectOptions = [
    { value: "", label: "Select Teacher" },
    ...teachers.map((teacher) => ({ value: teacher._id, label: teacher.fullName || "Teacher" })),
  ];
  const sectionSelectOptions = [
    { value: "", label: "Select All Sections" },
    ...SECTION_OPTIONS.map((section) => ({ value: section, label: `Section ${section}` })),
  ];

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const { data } = await api.get("/teachers", { params: { page: 1, limit: 500 } });
        setTeachers(data.data?.items || []);
      } catch {
        setTeachers([]);
      }
    };

    loadTeachers();
  }, []);

  const loadModalData = async (className, section) => {
    setModalLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get("/teacher-panel/students", { params: { className, section: section || "A" } }),
        api.get("/teacher-panel/attendance", {
          params: {
            className,
            section: section || "A",
            date: today(),
            page: 1,
            limit: 200,
          },
        }),
      ]);

      setStudents(studentsRes.data.data || []);

      const map = {};
      (attendanceRes.data.data?.items || []).forEach((item) => {
        const sid = item.studentId?._id || item.studentId;
        if (sid) {
          map[sid] = { id: item._id, status: item.status };
        }
      });
      setTodayRecords(map);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
      setStudents([]);
      setTodayRecords({});
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      const dates = buildDateRange(fromDate, toDate);
      if (!dates.length) {
        setHistoryRows([]);
        setHistoryStats({ present: 0, absent: 0, leave: 0, late: 0, unmarked: 0 });
        setHistoryLoading(false);
        return;
      }

      try {
        const responses = await Promise.all(
          dates.map((date) => api.get("/teacher-attendance", { params: { date } }))
        );
        const liveRows = [];
        let present = 0;
        let absent = 0;
        let leave = 0;
        let late = 0;
        let unmarked = 0;
        const teacherFilterId = selectedTeacherId ? String(selectedTeacherId) : "";

        responses.forEach((response, dateIndex) => {
          const date = dates[dateIndex];
          const attendanceItems = response.data?.data?.items || [];
          const attendanceMap = new Map(
            attendanceItems.map((item) => [String(item.teacherId), item.status || "UNMARKED"])
          );

          teachers.forEach((teacher) => {
            if (teacherFilterId && String(teacher._id) !== teacherFilterId) return;
            const matches = getTeacherAssignmentMatches(teacher, selectedClassName, selectedSection);
            const primaryAssignment = getPrimaryTeacherAssignment(teacher, selectedClassName, selectedSection);
            const assignment = matches[0] || primaryAssignment;

            if (selectedClassName && assignment.className !== selectedClassName) return;
            if (selectedSection && assignment.section !== selectedSection) return;

            const status = attendanceMap.get(String(teacher._id)) || "UNMARKED";
            if (status === "PRESENT") present += 1;
            else if (status === "ABSENT") absent += 1;
            else if (status === "LEAVE") leave += 1;
            else if (status === "LATE") late += 1;
            else unmarked += 1;

            liveRows.push({
              id: `${date}-${teacher._id}`,
              date,
              teacherName: teacher.fullName || "Teacher",
              className: assignment.className || "Unassigned",
              section: assignment.section || "A",
              status,
            });
          });
        });

        setHistoryRows(liveRows);
        setHistoryStats({ present, absent, leave, late, unmarked });
      } catch (err) {
        setHistoryError(err.response?.data?.message || "Failed to load teacher attendance history");
        setHistoryRows([]);
        setHistoryStats({ present: 0, absent: 0, leave: 0, late: 0, unmarked: 0 });
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [fromDate, toDate, selectedClassName, selectedSection, selectedTeacherId, teachers, teacherAttendanceRefreshKey]);

  const onClassChange = (className) => {
    setSelectedClassName(className);
    setSelectedSection("");
    setShowModal(false);
    setStudents([]);
    setTodayRecords({});
  };

  const onSectionChange = (section) => {
    setSelectedSection(section);
    setShowModal(false);
    setStudents([]);
    setTodayRecords({});
  };

  const openMarkAttendance = async () => {
    setShowModal(true);
    await loadModalData(selectedClassName || attendanceClassNames[0], selectedSection || "A");
  };

  const handleTeacherAttendanceChange = () => {
    setTeacherAttendanceRefreshKey((key) => key + 1);
  };

  const markAttendance = async (studentId, status) => {
    if (!selectedClass) return;
    setMarkingId(studentId);
    setError("");
    const payload = {
      studentId,
      className: selectedClass.className,
      section: selectedClass.section || "A",
      date: today(),
      status,
      remarks: "",
    };

    try {
      const existing = todayRecords[studentId];
      if (existing?.id) {
        await api.put(`/teacher-panel/attendance/${existing.id}`, { status, date: today(), remarks: "" });
        setTodayRecords((prev) => ({
          ...prev,
          [studentId]: { ...existing, status },
        }));
      } else {
        const { data } = await api.post("/teacher-panel/attendance", payload);
        setTodayRecords((prev) => ({
          ...prev,
          [studentId]: { id: data.data._id, status },
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarkingId("");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-sm">
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Attendance</h2>
          <p className={`text-sm ${mutedClass}`}>Record and review teacher attendance and history.</p>
        </div>
        <div className="flex w-full flex-wrap items-end gap-3 xl:w-auto xl:justify-end">
          <div className="min-w-[230px] max-w-[300px] flex-1">
            <ScrollableSelect
              label="Select Teacher"
              placeholder={teachers.length ? "Select teacher" : "Loading teachers..."}
              value={selectedTeacherId}
              options={teacherSelectOptions}
              onChange={setSelectedTeacherId}
              dark={dark}
              portal
            />
          </div>
          <div className="min-w-[180px] max-w-[220px] flex-1">
            <ScrollableSelect
              label="Class"
              placeholder="Select class"
              value={selectedClassName}
              options={classSelectOptions}
              onChange={onClassChange}
              dark={dark}
              portal
            />
          </div>
          <div className="min-w-[150px] max-w-[180px] flex-1">
            <ScrollableSelect
              label="Section"
              placeholder="Select section"
              value={selectedSection}
              options={sectionSelectOptions}
              onChange={onSectionChange}
              dark={dark}
              portal
            />
          </div>
          <div className="min-w-[170px] max-w-[220px] flex-1">
            <ModernDatePicker
              label="Date From"
              value={fromDate}
              onChange={setFromDate}
              dark={dark}
              placeholder="Select date"
            />
          </div>
          <div className="min-w-[170px] max-w-[220px] flex-1">
            <ModernDatePicker
              label="Date To"
              value={toDate}
              onChange={setToDate}
              dark={dark}
              placeholder="Select date"
            />
          </div>
          <button
            type="button"
            className={`h-[46px] rounded-xl border px-4 py-2.5 text-sm font-medium ${
              dark
                ? "border-white/[0.06] bg-[#161722] text-white hover:bg-white/[0.04]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setShowTeacherAttendanceModal(true)}
          >
            Teacher Attendance
          </button>
        </div>
      </div>

      {error ? <p className={`text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`}>{error}</p> : null}

      <div className={`${cardClass} overflow-hidden p-0`}>
        <div className={`border-b px-5 py-4 ${borderClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
              Attendance Records ({historyRows.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Present", value: historyStats.present, tone: "text-emerald-600" },
                { label: "Absent", value: historyStats.absent, tone: "text-rose-600" },
                { label: "On Leave", value: historyStats.leave, tone: "text-sky-600" },
                { label: "Late", value: historyStats.late, tone: "text-amber-600" },
                { label: "Not Marked", value: historyStats.unmarked, tone: "text-slate-500" },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className={dark ? "text-[#9e9e9e]" : "text-slate-500"}>{item.label}: </span>
                  <span className={item.tone}>{item.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Teacher</th>
              <th className="px-5 py-3 font-medium">Class</th>
              <th className="px-5 py-3 font-medium">Section</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {historyLoading ? (
              <tr>
                <td colSpan={5} className={`px-5 py-6 ${mutedClass}`}>
                  Loading...
                </td>
              </tr>
            ) : historyError ? (
              <tr>
                <td colSpan={5} className={`px-5 py-6 ${mutedClass}`}>
                  {historyError}
                </td>
              </tr>
            ) : historyRows.length ? (
              historyRows.map((row) => (
                <tr key={row.id} className={`border-t ${borderClass}`}>
                  <td className={`px-5 py-3 ${tableCellClass}`}>
                    {new Date(`${row.date}T12:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>{row.teacherName}</td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>{row.className}</td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>Section {row.section}</td>
                  <td className={`px-5 py-3 ${tableCellClass}`}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        TEACHER_STATUS_BADGES[row.status] || TEACHER_STATUS_BADGES.UNMARKED
                      }`}
                    >
                      {TEACHER_STATUS_LABELS[row.status] || "Not Marked"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={`px-5 py-6 ${mutedClass}`}>
                  No teacher attendance history for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={showModal && !!selectedClass}
        title={
          selectedClass
            ? `Attendance - ${selectedClass.className} - ${selectedClass.section}`
            : "Attendance"
        }
        onClose={() => setShowModal(false)}
        wide
        dark={dark}
      >
        {modalLoading ? (
          <p className={`text-sm ${mutedClass}`}>Loading students...</p>
        ) : students.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-3 py-2 font-medium">Roll No#</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentStatus = todayRecords[student._id]?.status;
                  const isMarking = markingId === student._id;
                  return (
                    <tr key={student._id} className={`border-t ${borderClass}`}>
                      <td className={`px-3 py-3 ${tableCellClass}`}>{student.admissionNo}</td>
                      <td className={`px-3 py-3 ${tableCellClass}`}>
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {STATUS_BUTTONS.map((btn) => (
                            <button
                              key={btn.value}
                              type="button"
                              disabled={isMarking}
                              onClick={() => markAttendance(student._id, btn.value)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                currentStatus === btn.value ? btn.active : idleStatusClass
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      ) : (
          <p className={`text-sm ${mutedClass}`}>No students found in this class.</p>
        )}
      </FormModal>

      <div className="pt-1">
        <TeacherActivityMonitor
          dark={dark}
          onToggleTheme={onToggleTheme}
          refreshKey={teacherAttendanceRefreshKey}
          branchSection={branchSection}
        />
      </div>

      <FormModal
        open={showTeacherAttendanceModal}
        title="Teacher Attendance"
        onClose={() => {
          setShowTeacherAttendanceModal(false);
          setError("");
        }}
        extraWide
        dark={dark}
        error={showTeacherAttendanceModal ? error : ""}
      >
        {showTeacherAttendanceModal ? (
          <TeacherAttendanceModal
            dark={dark}
            date={teacherAttendanceDate}
            onDateChange={setTeacherAttendanceDate}
            onAttendanceChange={handleTeacherAttendanceChange}
            refreshKey={teacherAttendanceRefreshKey}
          />
        ) : null}
      </FormModal>
    </section>
  );
}
