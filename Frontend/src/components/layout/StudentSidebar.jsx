import { useEffect, useState } from "react";
import { IconAcademic, IconAttendance, IconDashboard, IconFee, IconLogout } from "../icons/NavIcons";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { resolveStudentPhotoUrl } from "../../utils/mediaUrl";
import {
  ExpandableNav,
  SchoolCrest,
  SchoolNavItem,
  SchoolSidebarShell,
  useSchoolSidebarStyles,
} from "./schoolSidebarShared";

const academicChildren = ["Results", "Date Sheet", "Roll No Slip", "Class Time Table"];

export default function StudentSidebar({ selected, onSelect, onLogout, user, dark = true, entering = false }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(academicChildren.includes(selected));
  const styles = useSchoolSidebarStyles(dark);

  const cleanLastName =
    String(user?.lastName || "").trim() === "-" ||
    (user?.lastName &&
      user?.fatherName &&
      String(user.lastName).trim().toLowerCase() === String(user.fatherName).trim().toLowerCase())
      ? ""
      : user?.lastName || "";
  const studentName = `${user?.firstName || ""} ${cleanLastName}`.trim() || user?.fullName || "Student";
  const photoUrl = resolveStudentPhotoUrl(user?.studentPhotoUrl || user?.photoUrl || user?.profilePhotoUrl);

  const iconMap = {
    Dashboard: IconDashboard,
    "My Attendance": IconAttendance,
    "Fee Summary": IconFee,
    "Academic Records": IconAcademic,
  };

  const academicActive = selected === "Academic Records" || academicChildren.includes(selected);

  useEffect(() => {
    if (academicChildren.includes(selected)) setAcademicOpen(true);
  }, [selected]);

  const brandAvatar = photoUrl ? (
    <div
      className={`flex h-[52px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white ${
        dark ? "bg-[#1B5E3B] ring-1 ring-white/10" : "bg-[#1B5E3B]"
      }`}
    >
      <img src={photoUrl} alt={`${studentName} profile`} className="h-full w-full object-cover" />
    </div>
  ) : (
    <SchoolCrest className="h-[52px] w-[46px] shrink-0" />
  );

  return (
    <>
      <SchoolSidebarShell
        dark={dark}
        entering={entering}
        brandTitle="High School"
        brandSubtitle={studentName}
        brandAvatar={brandAvatar}
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
        {["Dashboard", "My Attendance", "Fee Summary"].map((item) => (
          <SchoolNavItem
            key={item}
            {...styles}
            active={selected === item}
            onClick={() => onSelect(item)}
            icon={iconMap[item]}
            label={item}
          />
        ))}

        <ExpandableNav
          {...styles}
          active={academicActive}
          label="Academic Records"
          icon={IconAcademic}
          menuOpen={academicOpen}
          onNavigate={() => {
            setAcademicOpen(true);
            onSelect("Results");
          }}
          onToggle={() => setAcademicOpen((open) => !open)}
          ariaExpand="Expand academic records"
          ariaCollapse="Collapse academic records"
        >
          {academicChildren.map((child) => (
            <SchoolNavItem
              key={child}
              {...styles}
              compact
              active={selected === child || (selected === "Academic Records" && child === "Results")}
              onClick={() => onSelect(child)}
              icon={IconAcademic}
              label={child}
            />
          ))}
        </ExpandableNav>
      </SchoolSidebarShell>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
      />
    </>
  );
}
