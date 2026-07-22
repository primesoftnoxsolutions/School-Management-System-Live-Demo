import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store/authSlice";
import { useAppTheme } from "../hooks/useAppTheme";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
const SUPER_ADMIN_FORM_DEFAULTS = { email: "", password: "" };

const SCHOOL_HIGHLIGHTS = [
  "Student records",
  "Fee and attendance",
  "Staff access",
  "Role-based security",
  "Reports and analytics",
  "Parent notifications",
];

const PRINCIPAL = {
  name: "Mr. Mudassir",
  quote: "Education is the most powerful weapon which you can use to change the world.",
};

const HIGHLIGHT_ICONS = ["users", "fees", "calendar", "staff", "shield", "chart"];

function SchoolLogo({ isDarkTheme, compact = false }) {
  const sizeClass = compact ? "h-20 w-20" : "h-28 w-28";

  return (
    <div className={`relative flex ${sizeClass} items-center justify-center`}>
      <img
        src="/Logo%20Insaf%20Grammar%20High%20School.png"
        alt="Insaf Grammar High School logo"
        className="h-full w-full object-contain drop-shadow-[0_16px_30px_rgba(26,147,69,0.22)]"
      />
    </div>
  );
}

function FeatureIcon({ type }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {type === "fees" ? (
        <>
          <path d="M7 4h8l3 3v13H7V4Z" {...common} />
          <path d="M15 4v4h3M10 12h5M10 16h5" {...common} />
        </>
      ) : type === "calendar" ? (
        <>
          <path d="M5 6h14v14H5V6ZM8 4v4M16 4v4M5 10h14" {...common} />
          <path d="m9 15 2 2 4-5" {...common} />
        </>
      ) : type === "staff" ? (
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" {...common} />
      ) : type === "shield" ? (
        <>
          <path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" {...common} />
          <path d="m9 12 2 2 4-5" {...common} />
        </>
      ) : type === "chart" ? (
        <path d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-8" {...common} />
      ) : (
        <>
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...common} />
          <path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0" {...common} />
        </>
      )}
    </svg>
  );
}

export default function LoginPage({ exiting = false }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState(() => ({ ...SUPER_ADMIN_FORM_DEFAULTS }));
  const [showPassword, setShowPassword] = useState(false);
  const [themeSpinning, setThemeSpinning] = useState(false);
  const { isDark: isDarkTheme, toggleTheme: toggleLoginTheme } = useAppTheme();

  const accent = isDarkTheme ? "#4CAF50" : "#1A9345";
  const brandRed = isDarkTheme ? "#ef5350" : "#C8232C";
  const brandRedHover = isDarkTheme ? "#e53935" : "#A81D25";
  const inputBg = isDarkTheme ? "#1a1b26" : "#ffffff";

  const handleLoginThemeToggle = () => {
    setThemeSpinning(true);
    toggleLoginTheme();
    window.setTimeout(() => setThemeSpinning(false), 520);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(login({ ...form, role: SUPER_ADMIN_ROLE }));
  };

  return (
    <div
      className={`login-theme-root min-h-screen [font-family:'Manrope','Inter','Segoe_UI',Arial,sans-serif] ${
        isDarkTheme ? "dashboard-dark bg-[#0b0c15]" : "bg-[#eef8f1]"
      } ${exiting ? "login-page-exit" : ""}`}
    >
      <div className={`login-theme-root flex min-h-screen w-full overflow-hidden ${isDarkTheme ? "bg-[#0b0c15]" : "bg-white"}`}>
        <aside
          className={`relative hidden w-[52%] overflow-hidden lg:block ${
            isDarkTheme ? "bg-[#0a1a12] text-white" : "bg-[#f5faf6] text-[#0F5C2E]"
          }`}
        >
          <div className={`absolute -left-24 -top-16 h-56 w-56 rounded-full ${isDarkTheme ? "bg-[#161722]" : "bg-[#e8f5ec]"}`} />
          <div className={`absolute -bottom-28 -left-28 h-64 w-64 rounded-full ${isDarkTheme ? "bg-[#4CAF50]/15" : "bg-[#e8f5ec]"}`} />
          <div
            className={`absolute left-8 top-6 h-20 w-20 bg-[radial-gradient(circle,currentColor_1.4px,transparent_1.4px)] [background-size:14px_14px] opacity-30 ${
              isDarkTheme ? "text-slate-500" : "text-slate-300"
            }`}
          />
          <div className={`absolute right-10 top-12 h-32 w-32 rounded-full border ${isDarkTheme ? "border-white/5" : "border-green-100"}`} />
          <div
            className={`absolute right-20 bottom-28 h-28 w-28 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] [background-size:13px_13px] ${
              isDarkTheme ? "text-white/10" : "text-green-200"
            }`}
          />

          <div className="relative z-10 mx-auto flex h-full max-w-3xl translate-x-8 flex-col justify-center px-10 py-8 lg:scale-[1.1] lg:origin-center xl:translate-x-12 xl:px-12">
            <div className="flex items-center gap-6">
              <SchoolLogo isDarkTheme={isDarkTheme} />
              <div>
                <h1
                  className={`text-5xl font-semibold uppercase leading-none tracking-tight [font-family:'Montserrat','Aptos_Display','Segoe_UI',Arial,sans-serif] ${
                    isDarkTheme ? "text-white" : "text-[#0F5C2E]"
                  }`}
                >
                  Insaf Grammar
                </h1>
                <p
                  className="mt-2 text-xl font-semibold uppercase tracking-[0.28em] [font-family:'Montserrat','Aptos_Display','Segoe_UI',Arial,sans-serif]"
                  style={{ color: brandRed }}
                >
                  High School
                </p>
                <div className={`mt-3 flex items-center gap-3 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                  <span className="h-px w-10" style={{ backgroundColor: brandRed }} />
                  <span>Learn</span>
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: brandRed }} />
                  <span>Grow</span>
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: brandRed }} />
                  <span>Succeed</span>
                  <span className="h-px w-10" style={{ backgroundColor: brandRed }} />
                </div>
              </div>
            </div>

            <section className="mt-8 max-w-xl">
              <h2 className={`text-sm font-extrabold uppercase tracking-wide ${isDarkTheme ? "text-white" : "text-[#0F5C2E]"}`}>
                About Our School
              </h2>
              <div className="mt-1 h-1 w-14 rounded-full" style={{ backgroundColor: brandRed }} />
              <p className={`mt-4 max-w-xl text-base leading-8 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                At Insaf Grammar High School, we nurture young minds with quality
                education, strong values, and modern learning environments to help
                every student shine and succeed in life.
              </p>
            </section>

            <ul className="mt-7 grid max-w-2xl grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
              {SCHOOL_HIGHLIGHTS.map((item, index) => (
                <li
                  key={item}
                  className={`flex items-center gap-3 text-lg font-semibold leading-6 ${
                    isDarkTheme ? "text-slate-100" : "text-[#0F5C2E]"
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    <FeatureIcon type={HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length]} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="ml-auto mt-20 max-w-xl xl:mt-24">
              <div className="flex items-center gap-7">
                <div
                  className={`relative h-40 w-40 shrink-0 overflow-hidden rounded-full bg-[#e8f5ec] shadow-[0_18px_36px_rgba(15,23,42,0.18)] ring-4 ${
                    isDarkTheme ? "ring-[#4CAF50]/60" : "ring-[#C8232C]"
                  }`}
                >
                  <img
                    src="/principal-profile.jpg"
                    alt={`${PRINCIPAL.name} profile`}
                    className="absolute inset-0 z-10 h-full w-full object-cover"
                  />
                  <div className="absolute left-1/2 top-8 h-14 w-14 -translate-x-1/2 rounded-full bg-[#9b6b50]" />
                  <div className="absolute left-1/2 top-6 h-16 w-20 -translate-x-1/2 rounded-t-full bg-slate-900" />
                  <div className="absolute bottom-0 left-1/2 h-24 w-28 -translate-x-1/2 rounded-t-[3.5rem] bg-[#0F5C2E]" />
                  <div className="absolute bottom-0 left-1/2 h-20 w-16 -translate-x-1/2 rounded-t-3xl bg-white" />
                  <div className="absolute bottom-0 left-1/2 h-20 w-7 -translate-x-1/2" style={{ backgroundColor: brandRed }} />
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-extrabold uppercase tracking-wide" style={{ color: brandRed }}>
                    Principal
                  </p>
                  <h2 className={`mt-2 text-3xl font-bold ${isDarkTheme ? "text-white" : "text-[#0F5C2E]"}`}>{PRINCIPAL.name}</h2>
                  <div className="my-3 h-px w-28" style={{ backgroundColor: brandRed }} />
                  <p className={`text-base leading-7 ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    <span className="mr-2 text-3xl font-serif leading-none" style={{ color: brandRed }}>
                      &ldquo;
                    </span>
                    {PRINCIPAL.quote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main
          className={`login-theme-root relative flex w-full flex-col items-center justify-center overflow-hidden px-6 py-10 sm:px-10 lg:w-[48%] ${
            isDarkTheme ? "bg-[#0b0c15]" : "bg-white"
          }`}
        >
          <button
            type="button"
            onClick={handleLoginThemeToggle}
            className={`absolute right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border transition ${
              themeSpinning ? "theme-toggle-spin" : ""
            } ${
              isDarkTheme
                ? "border-white/[0.06] bg-[#161722] hover:bg-white/[0.04]"
                : "border-slate-200 bg-white text-[#1A9345] shadow-sm hover:bg-green-50"
            }`}
            style={isDarkTheme ? { color: accent } : undefined}
            aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDarkTheme ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <path
                  d="M20 15.5A8.2 8.2 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <div
            className={`absolute -right-24 -top-24 h-64 w-64 rounded-bl-[9rem] rounded-br-[3rem] rounded-tl-[3rem] rounded-tr-[9rem] ${
              isDarkTheme ? "bg-[#161722]" : "bg-[#1A9345]"
            }`}
          />
          <div className={`absolute -bottom-24 -right-20 h-72 w-72 rounded-full ${isDarkTheme ? "bg-[#1a1b26]" : "bg-[#e8f5ec]"}`} />
          <div className={`absolute bottom-0 left-0 h-56 w-56 rounded-tr-full ${isDarkTheme ? "bg-[#161722]/80" : "bg-[#e8f5ec]"}`} />
          <div className={`absolute left-10 bottom-20 h-44 w-44 rounded-full border ${isDarkTheme ? "border-white/5" : "border-[#1A9345]/10"}`} />
          <div className={`absolute right-10 top-40 h-32 w-32 rounded-full border ${isDarkTheme ? "border-white/5" : "border-[#1A9345]/10"}`} />
          <div
            className={`absolute left-12 top-12 h-28 w-28 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] [background-size:13px_13px] ${
              isDarkTheme ? "text-white/10" : "text-green-200"
            }`}
          />
          <div
            className={`absolute right-24 bottom-24 h-28 w-28 bg-[radial-gradient(circle,currentColor_1.5px,transparent_1.5px)] [background-size:13px_13px] ${
              isDarkTheme ? "text-white/10" : "text-green-200"
            }`}
          />

          <div className="relative z-10 w-full max-w-[500px] lg:scale-[1.1] lg:origin-center">
            <div className="mb-7 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/90 shadow-[0_12px_28px_rgba(26,147,69,0.12)]">
                <SchoolLogo isDarkTheme={isDarkTheme} compact />
              </div>
              <h1 className={`text-2xl font-bold ${isDarkTheme ? "text-white" : "text-[#0F5C2E]"}`}>Insaf Grammar High School</h1>
            </div>

            <div className="mb-8 text-center">
              <h2 className={`text-4xl font-bold ${isDarkTheme ? "text-white" : "text-[#0F5C2E]"}`}>Welcome Back!</h2>
              <p className={`mt-2 text-base ${isDarkTheme ? "text-[#9e9e9e]" : "text-slate-600"}`}>Please sign in to continue</p>
              <div className="mx-auto mt-4 h-1 w-12 rounded-full" style={{ backgroundColor: brandRed }} />
            </div>

            <div className="mb-5">
              <p className={`mb-2 text-base font-semibold ${isDarkTheme ? "text-slate-200" : "text-slate-800"}`}>Login as:</p>
              <div
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-base font-semibold ${
                  isDarkTheme ? "border-white/[0.06] bg-[#161722] text-white" : "border-slate-200 bg-white text-slate-800"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: accent }}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <path
                      d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Zm-2.5 9 1.7 1.7 3.5-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="min-w-0 truncate">Super Admin</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="login-field-enter login-field-enter-delay-1">
                <label htmlFor="email" className={`mb-2 block text-base font-semibold ${isDarkTheme ? "text-slate-200" : "text-slate-800"}`}>
                  Email ID
                </label>
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition focus-within:ring-4 ${
                    isDarkTheme ? "border-white/[0.06] focus-within:ring-[#4CAF50]/15" : "border-slate-300 bg-white shadow-sm focus-within:border-[#1A9345] focus-within:ring-green-100"
                  }`}
                  style={isDarkTheme ? { backgroundColor: inputBg } : undefined}
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true">
                    <path d="M3 5h14v10H3V5Zm0 0 7 6 7-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{
                      "--login-autofill-bg": inputBg,
                      "--login-autofill-text": isDarkTheme ? "#f8fafc" : "#020617",
                      "--login-color-scheme": isDarkTheme ? "dark" : "light",
                    }}
                    className={`login-auth-input w-full bg-transparent text-lg font-semibold outline-none placeholder:text-slate-500 ${
                      isDarkTheme ? "text-slate-100" : "text-slate-950"
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="login-field-enter login-field-enter-delay-2">
                <label htmlFor="password" className={`mb-2 block text-base font-semibold ${isDarkTheme ? "text-slate-200" : "text-slate-800"}`}>
                  Password
                </label>
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition focus-within:ring-4 ${
                    isDarkTheme ? "border-white/[0.06] focus-within:ring-[#4CAF50]/15" : "border-slate-300 bg-white shadow-sm focus-within:border-[#1A9345] focus-within:ring-green-100"
                  }`}
                  style={isDarkTheme ? { backgroundColor: inputBg } : undefined}
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true">
                    <path
                      d="M6 9V7a4 4 0 0 1 8 0v2M5 9h10v8H5V9Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{
                      "--login-autofill-bg": inputBg,
                      "--login-autofill-text": isDarkTheme ? "#f8fafc" : "#020617",
                      "--login-color-scheme": isDarkTheme ? "dark" : "light",
                    }}
                    className={`login-auth-input w-full bg-transparent text-lg font-semibold outline-none placeholder:text-slate-500 ${
                      isDarkTheme ? "text-slate-100" : "text-slate-950"
                    }`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className={`text-slate-400 transition ${isDarkTheme ? "hover:text-[#4CAF50]" : "hover:text-[#1A9345]"}`}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                      <path d="M2.5 10s2.5-5 7.5-5 7.5 5 7.5 5-2.5 5-7.5 5-7.5-5-7.5-5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-base">
                <label className={`flex items-center gap-2 ${isDarkTheme ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" style={{ accentColor: accent }} />
                  Remember me
                </label>
                <button type="button" className="font-medium" style={{ color: accent }}>
                  Forgot Password?
                </button>
              </div>

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-bold uppercase tracking-wide text-white transition disabled:opacity-60"
                style={{ backgroundColor: brandRed, boxShadow: `0 12px 22px ${isDarkTheme ? "rgba(239,83,80,0.22)" : "rgba(200,35,44,0.22)"}` }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = brandRedHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = brandRed;
                }}
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <svg viewBox="0 0 20 20" className="h-6 w-6" aria-hidden="true">
                    <path
                      d="M8 5 13 10l-5 5M3 10h10M14 4h3v12h-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mx-auto mt-12 flex max-w-xs items-center justify-center gap-4 text-left">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: isDarkTheme ? "rgba(76,175,80,0.15)" : "#e8f5ec", color: accent }}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                  <path
                    d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3ZM9.5 12l1.8 1.8 3.7-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className={`text-sm leading-6 ${isDarkTheme ? "text-[#9e9e9e]" : "text-slate-600"}`}>
                Your data is safe with us.
                <br />
                We ensure secure and reliable access.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
