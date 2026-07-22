import { useEffect, useState } from "react";
import { IconLogout, navIconMap } from "../../super-admin/components/icons/NavIcons";
import LogoutConfirmModal from "./LogoutConfirmModal";
import {
  ExpandableNav,
  SchoolNavItem,
  SchoolSidebarShell,
  useSchoolSidebarStyles,
} from "./schoolSidebarShared";

const financeNavItems = ["Dashboard", "Purchase Management", "Furniture & Assets", "Fees Management", "Reports"];
const financeFeeSubpages = ["Fine Management", "Refund Management"];

export default function Sidebar({ selected, onSelect, onLogout, dark = true, entering = false }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [feeMenuOpen, setFeeMenuOpen] = useState(false);
  const styles = useSchoolSidebarStyles(dark);
  const isFeeSubpageActive = financeFeeSubpages.includes(selected);
  const feeParentActive = selected === "Fees Management" || isFeeSubpageActive;

  useEffect(() => {
    if (isFeeSubpageActive) setFeeMenuOpen(true);
  }, [isFeeSubpageActive]);

  return (
    <>
      <SchoolSidebarShell
        dark={dark}
        entering={entering}
        brandTitle="High School"
        brandSubtitle="Finance Portal"
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
        {financeNavItems.map((item) => {
          if (item === "Fees Management") {
            const FeeIcon = navIconMap[item] || navIconMap["Fee Management"];
            return (
              <ExpandableNav
                key={item}
                {...styles}
                active={feeParentActive}
                label="Fees Management"
                icon={FeeIcon}
                menuOpen={feeMenuOpen}
                onNavigate={() => {
                  onSelect(item);
                  setFeeMenuOpen(true);
                }}
                onToggle={() => setFeeMenuOpen((open) => !open)}
                ariaExpand="Expand fee pages"
                ariaCollapse="Collapse fee pages"
              >
                {financeFeeSubpages.map((child) => {
                  const ChildIcon = navIconMap[child];
                  return (
                    <SchoolNavItem
                      key={child}
                      {...styles}
                      compact
                      active={selected === child}
                      onClick={() => onSelect(child)}
                      icon={ChildIcon}
                      label={child}
                    />
                  );
                })}
              </ExpandableNav>
            );
          }

          const Icon = navIconMap[item] || navIconMap["Fee Management"];
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
