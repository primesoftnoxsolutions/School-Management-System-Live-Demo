import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Sidebar from "../components/layout/Sidebar";
import StudentSidebar from "../components/layout/StudentSidebar";
import TeacherSidebar from "../components/layout/TeacherSidebar";
import TeacherTopHeader from "../components/layout/TeacherTopHeader";
import TopHeader from "../components/layout/TopHeader";
import { useAppTheme } from "../hooks/useAppTheme";
import api from "../services/api/client";
import { logout } from "../store/authSlice";
import SuperAdminFeeManagementPage from "../super-admin/pages/FeeManagementPage";
import FeeRefundPage from "./FeeRefundPage";
import FinanceManagerDashboardPage from "./FinanceManagerDashboardPage";
import FineManagementPage from "./FineManagementPage";
import PurchaseManagementPage from "./PurchaseManagementPage";
import FurnitureAssetsPage from "./FurnitureAssetsPage";
import ReportsPage from "./ReportsPage";
import StudentAttendancePage from "./StudentAttendancePage";
import StudentPortalPage from "./StudentPortalPage";
import SuperAdminDashboardPage from "../super-admin/pages/DashboardPage";
import StudentClassTimeTablePage from "./student/StudentClassTimeTablePage";
import StudentDateSheetPage from "./student/StudentDateSheetPage";
import StudentFeeSummaryPage from "./student/StudentFeeSummaryPage";
import StudentResultsPage from "./student/StudentResultsPage";
import StudentRollNoSlipPage from "./student/StudentRollNoSlipPage";
import AssignedDutiesPage from "./teacher/AssignedDutiesPage";
import ClassTimeTablePage from "./teacher/ClassTimeTablePage";
import MonthlySyllabusPage from "./teacher/MonthlySyllabusPage";
import PaperResultCardManagementPage from "./teacher/PaperResultCardManagementPage";
import RollNoSlipsManagementPage from "./teacher/RollNoSlipsManagementPage";
import TeacherAcademicRecordsPage from "./teacher/TeacherAcademicRecordsPage";
import TeacherAttendancePage from "./teacher/TeacherAttendancePage";
import TeacherClassesPage from "./teacher/TeacherClassesPage";
import TeacherPanelPage from "./TeacherPanelPage";
import TeacherReportsPage from "./teacher/TeacherReportsPage";

const attendanceOptions = [
  { value: "PRESENT", label: "Present", className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100", dot: "bg-emerald-500" },
  { value: "ABSENT", label: "Absent", className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100", dot: "bg-rose-500" },
  { value: "LEAVE", label: "Leave", className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100", dot: "bg-amber-500" },
];

function TeacherDailyAttendancePopup({ user, dark = false }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const syncDailyStatus = async () => {
      const hour = new Date().getHours();
      if (hour >= 12) {
        if (!cancelled) {
          setShouldShow(false);
          setError("");
        }
        return;
      }

      try {
        const { data } = await api.get("/teacher-panel/my-attendance/today");
        if (cancelled) return;

        const todayStatus = data?.data?.status || "UNMARKED";
        const source = data?.data?.source || null;

        if (source === "ADMIN" || todayStatus !== "UNMARKED") {
          setShouldShow(false);
          setError("");
          return;
        }

        setShouldShow(hour < 12);
        setError("");
      } catch {
        if (!cancelled) setShouldShow(false);
      }
    };

    syncDailyStatus();
    const intervalId = window.setInterval(syncDailyStatus, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  const markStatus = async (nextStatus) => {
    if (marking) return;
    setMarking(true);
    setError("");
    try {
      await api.post("/teacher-panel/my-attendance/mark", { status: nextStatus });
      setShouldShow(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || "You cannot mark attendance for this day.");
        setShouldShow(false);
        window.setTimeout(() => setError(""), 4000);
      } else {
        setError(err.response?.data?.message || "Failed to mark attendance");
      }
    } finally {
      setMarking(false);
    }
  };

  if (error && !shouldShow) {
    return (
      <div className="pointer-events-none fixed right-5 top-24 z-[70] w-[min(92vw,410px)] lg:right-8">
        <div
          className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
            dark ? "border-rose-500/30 bg-[#161722] text-rose-300" : "border-rose-200 bg-white text-rose-700"
          }`}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!shouldShow) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-24 z-[70] w-[min(92vw,410px)] lg:right-8">
      <div className={`pointer-events-auto overflow-hidden rounded-3xl border shadow-2xl ${dark ? "border-white/10 bg-[#161722] text-white shadow-black/40" : "border-blue-100 bg-white text-slate-900 shadow-blue-950/15"}`}>
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-100">Daily Attendance</p>
              <h3 className="mt-1 text-lg font-black">Good Morning, {user?.fullName || "Teacher"}</h3>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <p className="text-[10px] font-bold uppercase text-blue-100">Until</p>
              <p className="text-sm font-black">12:00 PM</p>
            </div>
          </div>
        </div>

        <div className={`p-5 ${dark ? "bg-[#161722]" : "bg-white"}`}>
          {error ? <p className={`mb-3 text-sm ${dark ? "text-rose-300" : "text-rose-600"}`}>{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-3">
            {attendanceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={marking}
                onClick={() => markStatus(option.value)}
                className={`rounded-2xl border px-3 py-5 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${option.className}`}
              >
                <span className="flex items-center justify-center gap-2 text-sm font-black">
                  <span className={`h-2.5 w-2.5 rounded-full ${option.dot}`} />
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ entering = false, branchSection = "Boys", onBranchChange }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isStudent = user?.role === "STUDENT";
  const isTeacher = user?.role === "TEACHER";
  const isAccountant = user?.role === "ACCOUNTANT";
  const [selected, setSelected] = useState(isTeacher ? "My Panel" : "Dashboard");
  const [teacherAcademicIntent, setTeacherAcademicIntent] = useState(null);
  const { isDark: isAppDark, toggleTheme } = useAppTheme();

  if (isSuperAdmin) {
    return <SuperAdminDashboardPage entering={entering} branchSection={branchSection} onBranchChange={onBranchChange} />;
  }

  const handleTeacherNavigate = (target) => {
    if (typeof target === "object" && target?.page) {
      setTeacherAcademicIntent(target.intent ? { ...target.intent, stamp: Date.now() } : null);
      setSelected(target.page);
      return;
    }

    setTeacherAcademicIntent(null);
    setSelected(target);
  };

  const renderTeacherContent = () => {
    switch (selected) {
      case "My Panel":
        return <TeacherPanelPage onNavigate={handleTeacherNavigate} dark={isAppDark} />;
      case "Mark Attendance":
        return <TeacherAttendancePage dark={isAppDark} />;
      case "My Classes":
        return <TeacherClassesPage dark={isAppDark} />;
      case "Academic Records":
        return <TeacherAcademicRecordsPage dark={isAppDark} />;
      case "Monthly Syllabus":
        return <MonthlySyllabusPage dark={isAppDark} />;
      case "Assigned Duties":
        return <AssignedDutiesPage dark={isAppDark} />;
      case "Roll No Slips Management":
        return <RollNoSlipsManagementPage dark={isAppDark} />;
      case "Paper, Date Sheet & Result":
        return <PaperResultCardManagementPage dark={isAppDark} navigationIntent={teacherAcademicIntent} />;
      case "Class Time Table":
        return <ClassTimeTablePage dark={isAppDark} />;
      case "Reports":
        return <TeacherReportsPage dark={isAppDark} />;
      default:
        return <TeacherPanelPage onNavigate={handleTeacherNavigate} dark={isAppDark} />;
    }
  };

  const renderStudentContent = () => {
    if (selected === "Dashboard") return <StudentPortalPage user={user} dark={isAppDark} hideLogout fullWidth />;
    if (selected === "My Attendance") return <StudentAttendancePage dark={isAppDark} onToggleTheme={toggleTheme} />;
    if (selected === "Fee Summary") return <StudentFeeSummaryPage dark={isAppDark} />;
    if (selected === "Academic Records" || selected === "Results") return <StudentResultsPage dark={isAppDark} />;
    if (selected === "Date Sheet") return <StudentDateSheetPage dark={isAppDark} />;
    if (selected === "Class Time Table") return <StudentClassTimeTablePage dark={isAppDark} />;
    if (selected === "Roll No Slip") return <StudentRollNoSlipPage dark={isAppDark} />;
    return <StudentPortalPage user={user} dark={isAppDark} hideLogout fullWidth />;
  };

  const renderFinanceContent = () => {
    if (selected === "Dashboard") return <FinanceManagerDashboardPage onNavigate={setSelected} />;
    if (selected === "Purchase Management") return <PurchaseManagementPage dark={isAppDark} />;
    if (selected === "Furniture & Assets") return <FurnitureAssetsPage dark={isAppDark} branchSection={branchSection} />;
    if (selected === "Fees Management" || selected === "Finance Management" || selected === "Fee Management") {
      return (
        <SuperAdminFeeManagementPage
          role={user?.role}
          title="Fee Management"
          subtitle="Payment history for the selected class and section."
          dark={isAppDark}
        />
      );
    }
    if (selected === "Fine Management") return <FineManagementPage role={user?.role} dark={isAppDark} />;
    if (selected === "Refund Management" || selected === "Fee Refund") return <FeeRefundPage role={user?.role} dark={isAppDark} />;
    if (selected === "Reports") return <ReportsPage financeOnly dark={isAppDark} />;
    return <FinanceManagerDashboardPage onNavigate={setSelected} />;
  };

  const renderContent = () => {
    if (isTeacher) return renderTeacherContent();
    if (isStudent) return renderStudentContent();
    if (isAccountant) return renderFinanceContent();

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
        This account role is not connected to an active portal.
      </div>
    );
  };

  return (
    <div className={`dashboard-shell h-screen overflow-hidden ${isAppDark ? "dashboard-dark bg-[#0b0c15]" : "bg-[#f1efff] [font-family:'Inter','Segoe_UI',Arial,sans-serif]"}`}>
      {isTeacher ? (
        <TeacherSidebar selected={selected} onSelect={setSelected} onLogout={() => dispatch(logout())} user={user} dark={isAppDark} entering={entering} />
      ) : isStudent ? (
        <StudentSidebar selected={selected} onSelect={setSelected} onLogout={() => dispatch(logout())} user={user} dark={isAppDark} entering={entering} />
      ) : isAccountant ? (
        <Sidebar role={user?.role} selected={selected} onSelect={setSelected} onLogout={() => dispatch(logout())} dark={isAppDark} entering={entering} />
      ) : null}

      <main className={`dashboard-shell scrollbar-app h-screen overflow-y-auto lg:ml-72 ${isAppDark ? "dashboard-dark bg-[#0b0c15]" : "bg-[radial-gradient(circle_at_30%_5%,#ffffff_0,#f7f4ff_36%,#eeeaff_100%)]"} ${entering ? "app-main-enter" : ""}`}>
        <div className={entering ? "app-header-enter" : ""}>
          {isTeacher ? (
            <TeacherTopHeader user={user} dark={isAppDark} onToggleTheme={toggleTheme} />
          ) : isAccountant ? (
            <TopHeader user={user} dark={isAppDark} onToggleTheme={toggleTheme} />
          ) : null}
        </div>

        <div className={`px-5 pb-8 lg:px-6 ${entering ? "app-content-enter" : ""}`}>{renderContent()}</div>
        {isTeacher ? <TeacherDailyAttendancePopup user={user} dark={isAppDark} /> : null}
      </main>
    </div>
  );
}
