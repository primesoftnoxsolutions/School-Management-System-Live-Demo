import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useAppTheme } from "../hooks/useAppTheme";

import Sidebar from "../components/layout/Sidebar";
import TopHeader from "../components/layout/TopHeader";

import StudentsPage from "./StudentsPage";
import AdmissionsPage from "./AdmissionsPage";
import FeeManagementPage from "./FeeManagementPage";
import FeeRefundPage from "./FeeRefundPage";
import FineManagementPage from "./FineManagementPage";
import PayrollPage from "./PayrollPage";
import ReportsPage from "./ReportsPage";

import { logout } from "../store/authSlice";

import RoleDashboard from "./RoleDashboard";
import ModuleDataPage from "./ModuleDataPage";
import StudentPortfoliosPage from "./StudentPortfoliosPage";
import SchoolLeavingPage from "./SchoolLeavingPage";
import FurnitureAssetsPage from "../../pages/FurnitureAssetsPage";
import StudentRollSlipsPage from "./StudentRollSlipsPage";
import StudentDateSheetPage from "./StudentDateSheetPage";
import StudentResultCardsPage from "./StudentResultCardsPage";
import TeachersManagementPage from "./TeachersManagementPage";
import TeacherClassesPage from "./teacher/TeacherClassesPage";

import TeacherAttendancePage from "./teacher/TeacherAttendancePage";
import TeacherSyllabusPage from "./teacher/TeacherSyllabusPage";
import TeacherDutiesPage from "./teacher/TeacherDutiesPage";
import TeacherTimeTablePage from "./teacher/TeacherTimeTablePage";
import TeacherStatementsPage from "./teacher/TeacherStatementsPage";
import TeacherReportsPage from "./teacher/TeacherReportsPage";
import StudentAttendancePage from "./StudentAttendancePage";
import StudentTimeTablePage from "./StudentTimeTablePage";

export default function DashboardPage({ entering = false, branchSection = "Boys", onBranchChange }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selected, setSelected] = useState("Dashboard");
  const [teacherAssignmentsRefreshKey, setTeacherAssignmentsRefreshKey] = useState(0);
  const { isDark: isAppDark, toggleTheme } = useAppTheme();
  const refreshTeacherAssignments = () => setTeacherAssignmentsRefreshKey((key) => key + 1);

  const renderAdminContent = (currentBranch = branchSection) => {
    if (selected === "Dashboard") {
      return <RoleDashboard role={user?.role} onNavigate={setSelected} dark={isAppDark} branchSection={currentBranch} />;
    }

    if (selected === "Teachers") {
      return (
        <TeachersManagementPage
          dark={isAppDark}
          onToggleTheme={toggleTheme}
          branchSection={currentBranch}
          onAssignmentsUpdated={refreshTeacherAssignments}
        />
      );
    }

    if (selected === "Assigned Classes & Sections") {
      return <TeacherClassesPage dark={isAppDark} refreshKey={teacherAssignmentsRefreshKey} branchSection={currentBranch} />;
    }

    if (selected === "Attendance" || selected === "Mark Attendance")
      return <TeacherAttendancePage dark={isAppDark} onToggleTheme={toggleTheme} branchSection={currentBranch} />;
    if (selected === "Syllabus") return <TeacherSyllabusPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Duties") return <TeacherDutiesPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Time Table")
      return (
        <TeacherTimeTablePage
          dark={isAppDark}
          branchSection={currentBranch}
          onTimetableUpdated={refreshTeacherAssignments}
        />
      );
    if (selected === "Statements") return <TeacherStatementsPage dark={isAppDark} branchSection={currentBranch} />;

    if (selected === "Students") return <StudentsPage role={user?.role} dark={isAppDark} onToggleTheme={toggleTheme} branchSection={currentBranch} />;
    if (selected === "Student Admissions") return <AdmissionsPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Student Attendance") return <StudentAttendancePage dark={isAppDark} onToggleTheme={toggleTheme} branchSection={currentBranch} />;
    if (selected === "Student Time Table") return <StudentTimeTablePage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Student Roll Slips") return <StudentRollSlipsPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Student Date Sheet") return <StudentDateSheetPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Student Result Cards") return <StudentResultCardsPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Fee Management") return <FeeManagementPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Finance Management")
      return (
        <FeeManagementPage
          role={user?.role}
          dark={isAppDark}
          branchSection={currentBranch}
          title="Finance Management"
          subtitle="Finance operations and fee collection overview."
        />
      );
    if (selected === "Fee Refund") return <FeeRefundPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Fine Management") return <FineManagementPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Payroll") return <PayrollPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Students Portfolios") return <StudentPortfoliosPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "School Leaving" || selected === "Leaving & Character") return <SchoolLeavingPage role={user?.role} dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Furniture & Assets") return <FurnitureAssetsPage dark={isAppDark} branchSection={currentBranch} />;
    if (selected === "Reports") return <ReportsPage dark={isAppDark} branchSection={currentBranch} />;

    return <ModuleDataPage title={selected} dark={isAppDark} branchSection={currentBranch} />;
  };

  return (
    <div
      className={`dashboard-shell h-screen overflow-hidden ${
        isAppDark
          ? "dashboard-dark bg-[#0b0c15]"
          : isSuperAdmin
            ? "bg-[#f5f8ff] [font-family:'Inter','Segoe_UI',Arial,sans-serif]"
            : "bg-[#f1efff] [font-family:'Inter','Segoe_UI',Arial,sans-serif]"
      }`}
    >
      <Sidebar
        role={user?.role}
        user={user}
        selected={selected}
        onSelect={setSelected}
        onLogout={() => dispatch(logout())}
        dark={isAppDark}
        entering={entering}
      />

      <main
        className={`dashboard-shell scrollbar-app h-screen overflow-y-auto lg:ml-72 ${
          isAppDark
            ? "dashboard-dark bg-[#0b0c15]"
            : isSuperAdmin
              ? "bg-[#f5f8ff]"
              : "bg-[radial-gradient(circle_at_30%_5%,#ffffff_0,#f7f4ff_36%,#eeeaff_100%)]"
        } ${entering ? "app-main-enter" : ""}`}
      >
        <div className={entering ? "app-header-enter" : ""}>
          <TopHeader
            user={user}
            dark={isAppDark}
            branchSection={branchSection}
            onBranchChange={onBranchChange}
            onToggleTheme={toggleTheme}
          />
        </div>

        <div className={`mx-auto w-full max-w-[1600px] px-4 pb-8 pt-2 lg:px-6 ${entering ? "app-content-enter" : ""}`}>
          {renderAdminContent(branchSection)}
        </div>
      </main>
    </div>
  );
}
