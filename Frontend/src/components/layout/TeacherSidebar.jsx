import { useEffect, useState } from "react";
import { IconLogout, teacherNavIconMap } from "../icons/NavIcons";
import LogoutConfirmModal from "./LogoutConfirmModal";
import {
  ExpandableNav,
  SchoolNavItem,
  SchoolSidebarShell,
  useSchoolSidebarStyles,
} from "./schoolSidebarShared";

const academicItems = ["Academic Records", "Roll No Slips Management", "Paper, Date Sheet & Result"];
const myClassesItems = ["My Classes", "Class Time Table", "Monthly Syllabus", "Assigned Duties"];
const myClassesChildren = ["Class Time Table", "Monthly Syllabus", "Assigned Duties"];
const academicChildren = ["Roll No Slips Management", "Paper, Date Sheet & Result"];

export default function TeacherSidebar({ selected, onSelect, onLogout, user, dark = true, entering = false }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [myClassesOpen, setMyClassesOpen] = useState(false);
  const styles = useSchoolSidebarStyles(dark);

  const AcademicIcon = teacherNavIconMap["Academic Records"];
  const MyClassesIcon = teacherNavIconMap["My Classes"];
  const ReportsIcon = teacherNavIconMap.Reports;

  useEffect(() => {
    if (academicChildren.includes(selected)) setAcademicOpen(true);
  }, [selected]);

  useEffect(() => {
    if (myClassesChildren.includes(selected)) setMyClassesOpen(true);
  }, [selected]);

  return (
    <>
      <SchoolSidebarShell
        dark={dark}
        entering={entering}
        brandTitle="High School"
        brandSubtitle="Teacher Portal"
        logoutButton={
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15.5px] font-medium shadow-sm outline-none transition-colors focus:outline-none ${styles.logoutClass}`}
          >
            <IconLogout className={`h-5 w-5 ${styles.logoutIcon}`} />
            <span>Log Out</span>
          </button>
        }
      >
        {["My Panel", "Mark Attendance"].map((item) => {
          const Icon = teacherNavIconMap[item];
          return (
            <SchoolNavItem
              key={item}
              {...styles}
              active={selected === item}
              onClick={() => onSelect(item)}
              icon={Icon}
              label={item}
            />
          );
        })}

        <ExpandableNav
          {...styles}
          active={myClassesItems.includes(selected)}
          label="My Classes"
          icon={MyClassesIcon}
          menuOpen={myClassesOpen}
          onNavigate={() => {
            onSelect("My Classes");
            setMyClassesOpen(true);
          }}
          onToggle={() => setMyClassesOpen((open) => !open)}
          ariaExpand="Expand my classes"
          ariaCollapse="Collapse my classes"
        >
          {myClassesChildren.map((item) => (
            <SchoolNavItem
              key={item}
              {...styles}
              compact
              active={selected === item}
              onClick={() => onSelect(item)}
              icon={teacherNavIconMap[item] || MyClassesIcon}
              label={item}
            />
          ))}
        </ExpandableNav>

        <ExpandableNav
          {...styles}
          active={academicItems.includes(selected)}
          label="Academic Records"
          icon={AcademicIcon}
          menuOpen={academicOpen}
          onNavigate={() => {
            onSelect("Academic Records");
            setAcademicOpen(true);
          }}
          onToggle={() => setAcademicOpen((open) => !open)}
          ariaExpand="Expand academic records"
          ariaCollapse="Collapse academic records"
        >
          {academicChildren.map((item) => (
            <SchoolNavItem
              key={item}
              {...styles}
              compact
              active={selected === item}
              onClick={() => onSelect(item)}
              icon={teacherNavIconMap[item] || AcademicIcon}
              label={item}
            />
          ))}
        </ExpandableNav>

        <SchoolNavItem
          {...styles}
          active={selected === "Reports"}
          onClick={() => onSelect("Reports")}
          icon={ReportsIcon}
          label="Reports"
        />
      </SchoolSidebarShell>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        contextLabel={user?.fullName || "Teacher"}
        message="Are you sure you want to end this teacher session? Unsaved work should be saved before leaving."
        note="You can sign back in anytime with your teacher account."
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
      />
    </>
  );
}
