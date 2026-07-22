import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import FormModal from "../../components/ui/FormModal";
import ScrollableSelect from "../../components/ui/ScrollableSelect";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";

export default function TeacherClassesPage({ dark = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileClass, setProfileClass] = useState("");
  const [profileSection, setProfileSection] = useState("A");
  const [profileStudents, setProfileStudents] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);

  const assignedClassNames = useMemo(() => [...new Set(items.map((item) => item.className))], [items]);
  const assignedSections = useMemo(
    () => [...new Set(items.filter((item) => !profileClass || item.className === profileClass).map((item) => item.section || "A"))],
    [items, profileClass]
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/teacher-panel/classes", {
        params: { page: 1, limit: 100 },
      });
      setItems(data.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!profileClass && assignedClassNames.length) {
      setProfileClass(assignedClassNames[0]);
    }
  }, [assignedClassNames, profileClass]);

  useEffect(() => {
    if (assignedSections.length && !assignedSections.includes(profileSection)) {
      setProfileSection(assignedSections[0]);
    }
  }, [assignedSections, profileSection]);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!profileClass || !profileSection) {
        setProfileStudents([]);
        return;
      }
      setProfilesLoading(true);
      try {
        const { data } = await api.get("/teacher-panel/students", {
          params: { className: profileClass, section: profileSection },
        });
        setProfileStudents(data.data || []);
      } catch {
        setProfileStudents([]);
      } finally {
        setProfilesLoading(false);
      }
    };

    loadProfiles();
  }, [profileClass, profileSection]);

  const openPortfolio = async (student) => {
    setSelectedStudent(student);
    setAttendanceSummary(null);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const { data } = await api.get("/teacher-panel/attendance/summary", {
        params: {
          className: profileClass,
          section: profileSection,
          fromDate: from.toISOString().slice(0, 10),
          toDate: to.toISOString().slice(0, 10),
        },
      });
      const row = (data.data || []).find((item) => String(item.studentId) === String(student._id));
      setAttendanceSummary(row || null);
    } catch {
      setAttendanceSummary(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Classes</h2>
        <p className="text-sm text-slate-500">View students from your assigned classes and open student portfolios.</p>
      </div>

      <div className="ref-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Class Student Profiles</h3>
            <p className="text-sm text-slate-500">Select class and section to view assigned students.</p>
          </div>
          <div className="ml-auto grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <ScrollableSelect
              label="Class"
              placeholder="Select class"
              value={profileClass}
              options={assignedClassNames.map((className) => ({
                value: className,
                label: className,
              }))}
              onChange={setProfileClass}
              dark={dark}
              portal
            />
            <ScrollableSelect
              label="Section"
              placeholder="Select section"
              value={profileSection}
              options={assignedSections.map((section) => ({
                value: section,
                label: `Section ${section}`,
              }))}
              onChange={setProfileSection}
              dark={dark}
              portal
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {profilesLoading || loading ? (
            <p className="text-sm text-slate-500">Loading students...</p>
          ) : profileStudents.length ? (
            profileStudents.map((student) => {
              const photo = resolveStudentPhotoUrl(student.studentPhotoUrl);
              const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}` || "S";
              return (
                <button
                  key={student._id}
                  type="button"
                  onClick={() => openPortfolio(student)}
                  className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-black text-blue-700">
                    {photo ? <img src={photo} alt={`${student.firstName} ${student.lastName}`} className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{student.firstName} {student.lastName}</p>
                    <p className="text-xs font-semibold text-slate-500">Reg: {student.admissionNo || student._id}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">No students found for this class and section.</p>
          )}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <FormModal open={Boolean(selectedStudent)} title="Student Portfolio" onClose={() => setSelectedStudent(null)} wide>
        {selectedStudent ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Name", `${selectedStudent.firstName} ${selectedStudent.lastName}`],
                ["Admission No", selectedStudent.admissionNo || "-"],
                ["Roll No", selectedStudent.rollNumber || "-"],
                ["Class", `${selectedStudent.className || profileClass} - ${selectedStudent.section || profileSection}`],
                ["Father / Guardian", selectedStudent.fatherName || selectedStudent.guardianName || "-"],
                ["Status", selectedStudent.status || "ACTIVE"],
                ["Phone", selectedStudent.phoneNumber || "-"],
                ["Address", selectedStudent.address || "-"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance (Last 30 Days)</p>
              {attendanceSummary ? (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <p>Present: <strong>{attendanceSummary.present || 0}</strong></p>
                  <p>Absent: <strong>{attendanceSummary.absent || 0}</strong></p>
                  <p>Late: <strong>{attendanceSummary.late || 0}</strong></p>
                  <p>Leave: <strong>{attendanceSummary.leave || 0}</strong></p>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">No attendance summary available.</p>
              )}
            </div>
          </div>
        ) : null}
      </FormModal>
    </section>
  );
}
