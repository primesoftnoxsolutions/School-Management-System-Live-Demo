import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/client";
import ModernDatePicker from "../../components/ui/ModernDatePicker";

const DUTY_DEFS = [
  { key: "assembly", label: "Assembly Duty" },
  { key: "neatness", label: "Neatness Check" },
  { key: "uniform", label: "Uniform Check" },
  { key: "attendance", label: "Student Attendance" },
  { key: "corridor", label: "Corridor Monitoring" },
  { key: "discipline", label: "Discipline Monitoring" },
  { key: "classroom", label: "Classroom Supervision" },
  { key: "library", label: "Library Duty" },
  { key: "canteen", label: "Canteen Duty" },
  { key: "gate", label: "Gate Duty" },
  { key: "other", label: "Other Duties" },
];

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDay(value) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${value}T00:00:00`)).toUpperCase();
}

function weekMondayKey(value) {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toInputDate(date);
}

export default function AssignedDutiesPage({ dark = false }) {
  const [teacherName, setTeacherName] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));
  const [weekCommencing, setWeekCommencing] = useState("");
  const [weekDuties, setWeekDuties] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const safeSelectedDate = selectedDate || toInputDate(new Date());
  const dateWeekKey = weekMondayKey(safeSelectedDate);

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const { data } = await api.get("/teachers/my-panel");
        setTeacherName(data?.data?.teacher?.fullName || "");
      } catch {
        // name is optional; duties load still proceeds
      }
    };
    loadTeacher();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDuties = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const { data } = await api.get("/teacher-panel/duties", { params: { date: dateWeekKey } });
        if (cancelled) return;
        const dutyData = data?.data;
        setWeekCommencing(dutyData?.weekCommencing || dateWeekKey);
        setWeekDuties(Array.isArray(dutyData?.rows) ? dutyData.rows : []);
        setNotes(dutyData?.notes || "");
      } catch (err) {
        if (cancelled) return;
        if (!silent) {
          setError(err.response?.data?.message || "Failed to load assigned duties");
          setWeekDuties([]);
          setNotes("");
        }
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    };

    loadDuties();
    const poll = window.setInterval(() => loadDuties({ silent: true }), 5000);
    const onFocus = () => loadDuties({ silent: true });
    window.addEventListener("focus", onFocus);
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dateWeekKey]);

  const dayName = useMemo(() => formatDay(safeSelectedDate), [safeSelectedDate]);
  const displayDate = useMemo(() => formatDate(safeSelectedDate), [safeSelectedDate]);

  const selectedDayDuties = useMemo(() => {
    const day = new Date(`${safeSelectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
    const row = weekDuties.find((item) => String(item.day || "").toLowerCase() === day.toLowerCase());
    if (!row) return [];

    return DUTY_DEFS.filter((duty) =>
      Boolean(
        row.duties?.find(
          (item) =>
            item.assigned &&
            (item.key === duty.key || String(item.label || "").toLowerCase() === duty.label.toLowerCase())
        )
      )
    );
  }, [safeSelectedDate, weekDuties]);

  if (loading) {
    return <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading assigned duties...</p>;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Assigned Duties</h2>
          <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            View duties assigned by admin for the selected week
            {weekCommencing ? ` (commencing ${weekCommencing})` : ""}.
          </p>
        </div>

        <div className="min-w-[200px]">
          <ModernDatePicker
            label="Date"
            value={selectedDate}
            onChange={setSelectedDate}
            dark={dark}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border-4 border-blue-600 bg-white shadow-[0_18px_44px_rgba(37,99,235,0.14)]">
        <div className="relative overflow-hidden border-2 border-white bg-white px-8 pb-5 pt-3 text-blue-950">
          <div className="pointer-events-none absolute left-0 top-0 h-36 w-64 rounded-br-[100%] bg-blue-600" />
          <div className="pointer-events-none absolute left-5 top-2 h-32 w-80 rounded-br-[100%] border-t-4 border-white" />
          <div className="pointer-events-none absolute right-0 top-0 h-36 w-64 rounded-bl-[100%] bg-blue-600" />
          <div className="pointer-events-none absolute right-5 top-2 h-32 w-80 rounded-bl-[100%] border-t-4 border-white" />
          <div className="pointer-events-none absolute left-16 top-10 h-28 w-28 bg-[radial-gradient(circle,#60a5fa_1px,transparent_1.5px)] [background-size:8px_8px] opacity-50" />
          <div className="pointer-events-none absolute right-16 top-10 h-28 w-28 bg-[radial-gradient(circle,#60a5fa_1px,transparent_1.5px)] [background-size:8px_8px] opacity-50" />

          <div className="relative z-10 grid grid-cols-[8rem_minmax(0,1fr)_8rem] items-start gap-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-700">
                <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
                  <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#0b55c8" strokeWidth="2.4" />
                  <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#0b55c8" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-black uppercase leading-none tracking-wide text-blue-950">Teacher Assigned Duties</h3>
              <div className="mx-auto mt-3 max-w-sm bg-blue-700 px-8 py-1 text-xl font-black italic text-white [clip-path:polygon(6%_0,94%_0,100%_100%,0_100%)]">
                Your Duties For The Day
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-700">
                <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden="true">
                  <path d="M32 5 52 12v17c0 13-8.4 23.2-20 29C20.4 52.2 12 42 12 29V12l20-7Z" fill="#ffffff" stroke="#0b55c8" strokeWidth="2.4" />
                  <path d="M32 12 46 17v12c0 8.6-5.8 16.2-14 21-8.2-4.8-14-12.4-14-21V17l14-5Z" fill="#eff6ff" stroke="#0b55c8" strokeWidth="1.8" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-4 flex max-w-xl items-center justify-center gap-4 rounded-md bg-blue-50/70 px-5 py-3 text-sm font-black uppercase">
            <span className="text-blue-800">Teacher Name:</span>
            <input
              value={teacherName}
              readOnly
              className="min-w-44 border-0 border-b border-blue-300 bg-transparent pb-1 text-center normal-case text-slate-950 outline-none"
            />
          </div>

          <div className="relative z-10 mt-3 grid overflow-hidden rounded-md border border-blue-300 md:grid-cols-2">
            <div className="flex items-center gap-5 border-b border-blue-200 px-10 py-3 md:border-b-0 md:border-r">
              <span className="text-base font-black uppercase text-blue-800">Date:</span>
              <span className="text-base font-bold text-slate-950">{displayDate}</span>
            </div>
            <div className="flex items-center gap-5 px-10 py-3">
              <span className="text-base font-black uppercase text-blue-800">Day:</span>
              <span className="text-base font-black text-slate-950">{dayName}</span>
            </div>
          </div>

          <div className="relative z-10 mt-3 overflow-hidden rounded-md border border-blue-400">
            <div className="bg-blue-800 py-1 text-center text-xl font-black uppercase text-white">Assigned Duties</div>
            <table className="w-full table-fixed border-collapse text-blue-950">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="w-[6%] border border-blue-400 px-1 py-2 text-sm font-black uppercase">Sr. #</th>
                  <th className="border border-blue-400 px-2 py-2 text-sm font-black uppercase">Duties</th>
                  <th className="w-[10%] border border-blue-400 px-2 py-2 text-sm font-black uppercase">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {selectedDayDuties.length ? (
                  selectedDayDuties.map((duty, index) => (
                    <tr key={duty.key} className="h-9">
                      <td className="border border-blue-300 px-1 py-1 text-center text-lg font-black text-blue-700">{index + 1}</td>
                      <td className="border border-blue-300 px-5 py-1 text-sm font-bold text-slate-950">{duty.label}</td>
                      <td className="border border-blue-300 px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked
                          readOnly
                          disabled
                          className="h-5 w-5 rounded-sm border-blue-500 text-blue-700 opacity-100"
                          aria-label={`Assigned ${duty.label}`}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border border-blue-300 px-4 py-8 text-center text-sm font-bold text-slate-500">
                      No duties assigned for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="relative z-10 mt-5 flex items-center gap-3 text-sm font-bold text-slate-950">
            <span className="rounded bg-blue-800 px-4 py-1 font-black uppercase text-white">Note:</span>
            <span className="flex-1 border-b border-blue-300 pb-1">
              {notes ||
                (selectedDayDuties.length
                  ? "Please ensure all assigned duties are completed sincerely."
                  : "No duties assigned for this date.")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
