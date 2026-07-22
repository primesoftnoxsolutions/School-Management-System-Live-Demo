import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import AppLaunchSplash from "./components/layout/AppLaunchSplash";
import RefreshSuccessNotice from "./components/layout/RefreshSuccessNotice";
import { clearJustLoggedIn, fetchMe } from "./store/authSlice";
import { readAppThemeDark } from "./utils/appTheme";

const SPLASH_HOLD_MS = 1100;
const SPLASH_EXIT_MS = 480;

export default function App() {
  const dispatch = useDispatch();
  const { user, loading, justLoggedIn, sessionChecked } = useSelector((state) => state.auth);
  const [showSplash, setShowSplash] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);
  const [branchSection, setBranchSection] = useState(() => {
    const stored = localStorage.getItem("schoolDashboardBranchSection");
    return stored === "Girls" || stored === "Boys" ? stored : "Boys";
  });
  const hadStoredSessionOnMount = useRef(Boolean(sessionStorage.getItem("hadSession")));
  const refreshNoticeTriggered = useRef(false);
  const isDarkTheme = readAppThemeDark();

  const hideRefreshNotice = useCallback(() => {
    setShowRefreshNotice(false);
  }, []);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem("schoolDashboardBranchSection", branchSection);
  }, [branchSection]);

  useLayoutEffect(() => {
    if (!user) {
      setShowSplash(false);
      setSplashExiting(false);
      setShowDashboard(false);
      return undefined;
    }

    if (!justLoggedIn) {
      setShowSplash(false);
      setSplashExiting(false);
      setShowDashboard(true);
      return undefined;
    }

    setShowSplash(true);
    setSplashExiting(false);
    setShowDashboard(false);

    const startExitTimer = window.setTimeout(() => {
      setSplashExiting(true);
      setShowDashboard(true);
    }, SPLASH_HOLD_MS);

    const hideSplashTimer = window.setTimeout(() => {
      setShowSplash(false);
      setSplashExiting(false);
      dispatch(clearJustLoggedIn());
    }, SPLASH_HOLD_MS + SPLASH_EXIT_MS);

    return () => {
      window.clearTimeout(startExitTimer);
      window.clearTimeout(hideSplashTimer);
    };
  }, [user, justLoggedIn, dispatch]);

  useEffect(() => {
    if (!hadStoredSessionOnMount.current || refreshNoticeTriggered.current) return;
    if (!user || loading || justLoggedIn || !sessionChecked) return;

    refreshNoticeTriggered.current = true;
    setShowRefreshNotice(true);
  }, [user, loading, justLoggedIn, sessionChecked]);

  const showLogin = sessionChecked && !user;

  return (
    <>
      {showLogin ? <LoginPage /> : null}
      {showDashboard ? (
        <DashboardPage entering={justLoggedIn} branchSection={branchSection} onBranchChange={setBranchSection} />
      ) : null}
      {showSplash ? <AppLaunchSplash user={user} dark={isDarkTheme} exiting={splashExiting} /> : null}
      {showRefreshNotice ? (
        <RefreshSuccessNotice dark={isDarkTheme} onDone={hideRefreshNotice} />
      ) : null}
    </>
  );
}
