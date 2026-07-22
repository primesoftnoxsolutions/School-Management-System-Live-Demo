import { useEffect, useMemo, useRef, useState } from "react";

import FormModal from "../ui/FormModal";

const STORAGE_KEY = "appointment-letter-draft";
const SCHOOL_LOGO = "/Logo%20Insaf%20Grammar%20High%20School.png";
const defaultToAddress = "The Principal,\nInsaf Grammar School,\n19 Kassi Vehari Road, Multan.";
const PAGE_BASE_WIDTH = 1080;
const PAGE_BASE_HEIGHT = 1280;

function makeInitialDraft() {
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 10);

  return {
    orderNo: "",
    dated: formattedDate,
    name: "",
    fatherName: "",
    residence: "",
    appointmentAs: "",
    salary: "",
    effectiveFrom: "",
    toAddress: defaultToAddress,
    dob: "",
    qualification: "",
    domicile: "",
    address: "",
    photoDataUrl: "",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function LineField({ label, value, onChange, placeholder = "", wide = false, as = "input" }) {
  const baseClass =
    "w-full border-0 border-b border-slate-400 bg-transparent px-0 py-1 text-[15px] font-medium text-slate-900 outline-none focus:border-[#0f3d91] focus:ring-0";

  return (
    <label className={`flex items-end gap-3 ${wide ? "col-span-2" : ""}`}>
      <span className="shrink-0 text-[15px] font-semibold text-slate-900">{label}</span>
      {as === "textarea" ? (
        <textarea
          className={`${baseClass} min-h-[92px] resize-none leading-7`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={baseClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function StepBadge({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
        active ? "bg-[#0f3d91] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function LetterFrame({ children }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-20 w-20 bg-[linear-gradient(135deg,rgba(15,61,145,0.96)_0%,rgba(15,61,145,0.96)_50%,transparent_50%)]" />
        <div className="absolute bottom-0 left-0 h-20 w-20 bg-[linear-gradient(315deg,rgba(15,61,145,0.96)_0%,rgba(15,61,145,0.96)_50%,transparent_50%)]" />
        <div className="absolute inset-x-4 top-16 h-px bg-slate-200" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export default function AppointmentLetterModal({ open, onClose, dark = false }) {
  const fileInputRef = useRef(null);
  const viewportRef = useRef(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(() => makeInitialDraft());
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!open) return undefined;

    setStep(1);
    setStatusMessage("");

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraft({ ...makeInitialDraft(), ...parsed });
        return undefined;
      }
    } catch {
      // Ignore malformed saved drafts.
    }

    setDraft(makeInitialDraft());
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const updateScale = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const { width, height } = viewport.getBoundingClientRect();
      const nextScale = Math.min(width / PAGE_BASE_WIDTH, height / PAGE_BASE_HEIGHT, 1);
      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    const raf = requestAnimationFrame(updateScale);
    const resizeObserver = typeof ResizeObserver !== "undefined" && viewportRef.current
      ? new ResizeObserver(updateScale)
      : null;
    if (resizeObserver && viewportRef.current) resizeObserver.observe(viewportRef.current);
    window.addEventListener("resize", updateScale);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateScale);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [open, step]);

  const pageLabel = useMemo(() => (step === 1 ? "Page 1 of 2" : "Page 2 of 2"), [step]);

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const onSelectPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const photoDataUrl = await readFileAsDataUrl(file);
      setDraft((current) => ({ ...current, photoDataUrl }));
      setStatusMessage("Photo updated.");
    } catch {
      setStatusMessage("Could not read the selected photo.");
    } finally {
      event.target.value = "";
    }
  };

  const saveDraft = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setStatusMessage("Appointment letter saved locally.");
    } catch {
      setStatusMessage("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const printDraft = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      setStatusMessage("Popup blocked. Please allow popups to print.");
      return;
    }

    const pageOneRows = [
      ["Order No", draft.orderNo],
      ["Dated", draft.dated],
      ["Mr./Ms.", draft.name],
      ["D/O S/O", draft.fatherName],
      ["Residence of", draft.residence],
      ["Appointed as", draft.appointmentAs],
      ["Salary", draft.salary],
      ["Effect from", draft.effectiveFrom],
    ]
      .map(
        ([label, value]) => `
          <div class="row">
            <div class="label">${escapeHtml(label)}:</div>
            <div class="value">${escapeHtml(value || " ")}</div>
          </div>
        `,
      )
      .join("");

    const pageTwoRows = [
      ["Name", draft.name],
      ["Father's Name", draft.fatherName],
      ["DOB", draft.dob],
      ["Qualification", draft.qualification],
      ["Domicile", draft.domicile],
      ["Address", draft.address],
    ]
      .map(
        ([label, value]) => `
          <div class="row">
            <div class="label">${escapeHtml(label)}:</div>
            <div class="value">${escapeHtml(value || " ")}</div>
          </div>
        `,
      )
      .join("");

    const photoMarkup = draft.photoDataUrl
      ? `<img class="photo" src="${draft.photoDataUrl}" alt="Teacher photo" />`
      : `<div class="photo placeholder">Photo</div>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Appointment Letter</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              background: #ffffff;
            }
            .page {
              position: relative;
              width: 100%;
              min-height: 1000px;
              border: 3px solid #123f9b;
              border-radius: 18px;
              padding: 22px 24px 26px;
              margin: 0 auto 24px;
              overflow: hidden;
            }
            .page:before,
            .page:after {
              content: "";
              position: absolute;
              width: 220px;
              height: 220px;
              background: linear-gradient(135deg, #123f9b 0%, #123f9b 50%, transparent 50%);
              opacity: 0.95;
            }
            .page:before { top: 0; right: 0; transform: rotate(0deg); }
            .page:after { bottom: 0; left: 0; transform: rotate(180deg); }
            .top {
              display: flex;
              align-items: center;
              gap: 18px;
            }
            .logo {
              width: 84px;
              height: 84px;
              object-fit: contain;
              flex: 0 0 auto;
            }
            .brand h1 {
              margin: 0;
              font-size: 38px;
              line-height: 1;
              color: #123f9b;
              letter-spacing: 0.01em;
              font-weight: 800;
            }
            .brand .sub {
              margin-top: 4px;
              font-size: 18px;
              color: #d39a1f;
              letter-spacing: 0.45em;
              font-weight: 700;
            }
            .rule {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-top: 8px;
              color: #123f9b;
              font-size: 14px;
              justify-content: center;
            }
            .rule:before,
            .rule:after {
              content: "";
              height: 1px;
              flex: 1;
              background: #d9dee8;
            }
            .heading {
              margin: 24px auto 18px;
              width: fit-content;
              padding: 10px 24px;
              background: #123f9b;
              color: white;
              font-size: 26px;
              font-weight: 800;
              letter-spacing: 0.02em;
              border-radius: 6px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px 28px;
              margin-top: 18px;
            }
            .row {
              display: grid;
              grid-template-columns: 170px 1fr;
              gap: 10px;
              align-items: start;
              margin-bottom: 12px;
            }
            .label {
              font-size: 15px;
              font-weight: 700;
            }
            .value {
              min-height: 18px;
              border-bottom: 1px solid #4b5563;
              padding-bottom: 2px;
              font-size: 15px;
              line-height: 1.5;
              white-space: pre-wrap;
            }
            .page-two {
              display: grid;
              grid-template-columns: 1.15fr 0.4fr;
              gap: 24px;
              margin-top: 12px;
            }
            .body-copy {
              margin-top: 14px;
              font-size: 16px;
              line-height: 1.7;
              text-align: justify;
            }
            .photo {
              width: 92px;
              height: 120px;
              object-fit: cover;
              border: 1px solid #6b7280;
              background: #f8fafc;
            }
            .placeholder {
              display: flex;
              align-items: center;
              justify-content: center;
              color: #6b7280;
              font-size: 14px;
            }
            .signature {
              margin-top: 72px;
              text-align: right;
              font-size: 17px;
            }
            .signature-line {
              display: inline-block;
              width: 180px;
              border-top: 1px solid #4b5563;
              margin-top: 22px;
            }
            @media print {
              body { padding: 0; }
              .page { page-break-after: always; margin: 0; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top">
              <img class="logo" src="${SCHOOL_LOGO}" alt="Insaf Grammar School" />
              <div class="brand">
                <h1>INSAF GRAMMAR SCHOOL</h1>
                <div class="sub">HIGH SCHOOL</div>
                <div class="rule">Learn <span>•</span> Grow <span>•</span> Succeed</div>
              </div>
            </div>
            <div class="heading">TEACHER APPOINTMENT LETTER</div>
            ${pageOneRows}
            <div style="margin-top:24px; padding:0 8px;">
              <div style="text-align:center; font-weight:800; color:#123f9b; font-size:20px; text-decoration:underline; margin-bottom:10px;">TERMS &amp; CONDITIONS</div>
              <ol style="margin: 0; padding-left: 22px; font-size: 16px; line-height: 1.6;">
                <li>The appointment is on purely temporary basis and liable to termination with or without any notice or assigning reason at any time.</li>
                <li>He / She should carry with his/her original certificates to enable the Headmaster/Principal of the concerned institutions.</li>
                <li>The candidate appointed in this letter will have to join his/her duty on mentioned date immediately.</li>
              </ol>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div style="font-weight:700; margin-top:8px;">PRINCIPAL</div>
            </div>
          </div>

          <div class="page">
            <div class="top">
              <img class="logo" src="${SCHOOL_LOGO}" alt="Insaf Grammar School" />
              <div class="brand">
                <h1>INSAF GRAMMAR SCHOOL</h1>
                <div class="sub">HIGH SCHOOL</div>
                <div class="rule">Learn <span>•</span> Grow <span>•</span> Succeed</div>
              </div>
            </div>
            <div class="page-two">
              <div>
                <div style="font-size: 16px; font-weight: 700; margin-top: 6px;">To,</div>
                <div style="margin-top: 8px; line-height: 1.5; font-size: 16px;">
                  ${escapeHtml(draft.toAddress).replaceAll("\n", "<br />")}
                </div>
                <div style="margin-top: 16px; font-size: 16px; font-weight: 700;">Subject: Application For The Post of Teacher.</div>
                <div class="body-copy">
                  Madam,<br /><br />
                  Having come to know through some reliable sources that posts of teachers is lying vacant under your kind control.
                  I offer my services for one of the same. My Bio Data is as under.
                </div>
                <div style="margin-top: 18px;">${pageTwoRows}</div>
                <div class="body-copy">
                  State copies of my testimonials are submitted for your kind perusal.<br /><br />
                  If the given a chance to serve under your kind control.<br /><br />
                  I shall do my best to give satisfaction with my work and conduct.<br /><br />
                  Thanking you in anticipation.
                </div>
                <div class="signature" style="margin-top: 44px;">
                  Yours obediently,
                  <div class="signature-line"></div>
                </div>
              </div>
              <div style="padding-top: 140px;">
                ${photoMarkup}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.onafterprint = () => {
      printWindow.close();
    };
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const pageOne = (
    <LetterFrame>
      <div className="flex items-center gap-4">
        <img src={SCHOOL_LOGO} alt="Insaf Grammar School" className="h-20 w-20 object-contain" />
        <div className="min-w-0">
          <h3 className="text-[26px] font-extrabold tracking-tight text-[#123f9b]">INSAF GRAMMAR SCHOOL</h3>
          <p className="mt-1 text-[17px] font-bold tracking-[0.5em] text-[#d39a1f]">HIGH SCHOOL</p>
          <p className="mt-2 flex items-center gap-3 text-sm font-medium text-[#123f9b]">
            <span className="h-px w-8 bg-[#d39a1f]" />
            Learn <span className="text-[#d39a1f]">•</span> Grow <span className="text-[#d39a1f]">•</span> Succeed
            <span className="h-px w-8 bg-[#d39a1f]" />
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-[#123f9b] px-5 py-3 text-center text-[17px] font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(18,63,155,0.25)]">
        TEACHER APPOINTMENT LETTER
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LineField label="Order No" value={draft.orderNo} onChange={(value) => updateField("orderNo", value)} />
          <LineField label="Dated" value={draft.dated} onChange={(value) => updateField("dated", value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LineField label="Mr./Ms." value={draft.name} onChange={(value) => updateField("name", value)} />
          <LineField label="D/O S/O" value={draft.fatherName} onChange={(value) => updateField("fatherName", value)} />
        </div>

        <LineField label="Residence of" value={draft.residence} onChange={(value) => updateField("residence", value)} />
        <LineField label="Appointed as" value={draft.appointmentAs} onChange={(value) => updateField("appointmentAs", value)} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LineField label="Temporary basis salary Rs." value={draft.salary} onChange={(value) => updateField("salary", value)} />
          <LineField label="Effect from" value={draft.effectiveFrom} onChange={(value) => updateField("effectiveFrom", value)} />
        </div>
      </div>

      <div className="mt-7">
        <div className="mx-auto mb-4 w-fit rounded-full bg-[#123f9b] px-5 py-1.5 text-sm font-bold tracking-wide text-white">
          TERMS &amp; CONDITIONS
        </div>
        <ol className="space-y-3 pl-6 text-[15px] leading-7 text-slate-700">
          <li>The appointment is on purely temporary basis and liable to termination with or without any notice or assigning reason at any time.</li>
          <li>He / She should carry with his/her original certificates to enable the Headmaster/Principal of the concerned institutions.</li>
          <li>The candidate appointed in this letter will have to join his/her duty on mentioned date immediately.</li>
        </ol>
      </div>

      <div className="mt-8 text-right">
        <div className="ml-auto h-px w-40 bg-slate-400" />
        <p className="mt-2 pr-4 text-sm font-bold tracking-[0.2em] text-slate-800">PRINCIPAL</p>
      </div>
    </LetterFrame>
  );

  const pageTwo = (
    <LetterFrame>
      <div className="flex items-center gap-4">
        <img src={SCHOOL_LOGO} alt="Insaf Grammar School" className="h-20 w-20 object-contain" />
        <div className="min-w-0">
          <h3 className="text-[26px] font-extrabold tracking-tight text-[#123f9b]">INSAF GRAMMAR SCHOOL</h3>
          <p className="mt-1 text-[17px] font-bold tracking-[0.5em] text-[#d39a1f]">HIGH SCHOOL</p>
          <p className="mt-2 flex items-center gap-3 text-sm font-medium text-[#123f9b]">
            <span className="h-px w-8 bg-[#d39a1f]" />
            Learn <span className="text-[#d39a1f]">•</span> Grow <span className="text-[#d39a1f]">•</span> Succeed
            <span className="h-px w-8 bg-[#d39a1f]" />
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="text-[15px] font-bold text-slate-900">To,</div>
          <div className="pl-4 text-[15px] leading-7 text-slate-800">
            {draft.toAddress.split("\n").map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}
                <br />
              </span>
            ))}
          </div>

          <div className="pt-1 text-[15px] font-bold text-slate-900">Subject: Application For The Post of Teacher.</div>

          <p className="max-w-3xl text-[15px] leading-7 text-slate-700">
            Madam,
            <br />
            <br />
            Having come to know through some reliable sources that posts of teachers is lying vacant under your kind control. I offer
            my services for one of the same. My Bio Data is as under.
          </p>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <LineField label="Name" value={draft.name} onChange={(value) => updateField("name", value)} />
            <LineField label="Father's Name" value={draft.fatherName} onChange={(value) => updateField("fatherName", value)} />
            <LineField label="DOB" value={draft.dob} onChange={(value) => updateField("dob", value)} />
            <LineField label="Qualification" value={draft.qualification} onChange={(value) => updateField("qualification", value)} />
            <LineField label="Domicile" value={draft.domicile} onChange={(value) => updateField("domicile", value)} />
            <LineField
              label="Address"
              value={draft.address}
              onChange={(value) => updateField("address", value)}
              as="textarea"
              wide
            />
          </div>

          <p className="max-w-3xl pt-2 text-[15px] leading-7 text-slate-700">
            State copies of my testimonials are submitted for your kind perusal.
            <br />
            <br />
            If the given a chance to serve under your kind control.
            <br />
            <br />
            I shall do my best to give satisfaction with my work and conduct.
            <br />
            <br />
            Thanking you in anticipation.
          </p>
        </div>

        <div className="space-y-4 pt-16">
          <div className="text-[15px] font-semibold text-slate-900">Photo</div>
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 w-28 items-center justify-center overflow-hidden rounded-sm border border-slate-400 bg-slate-50 text-sm font-medium text-slate-500 transition hover:border-[#123f9b] hover:text-[#123f9b]"
            >
              {draft.photoDataUrl ? (
                <img src={draft.photoDataUrl} alt="Teacher" className="h-full w-full object-cover" />
              ) : (
                <span>Upload</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-[#123f9b]/20 bg-[#123f9b]/5 px-4 py-2 text-xs font-semibold text-[#123f9b] hover:bg-[#123f9b]/10"
            >
              Choose Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectPhoto} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-6">
        <p className="text-[15px] font-medium text-slate-700">Use the final step to save the draft or print the letter.</p>
        <div className="text-right">
          <div className="ml-auto h-px w-44 bg-slate-400" />
          <p className="mt-2 text-sm font-bold tracking-[0.2em] text-slate-800">YOURS OBEDIENTLY</p>
        </div>
      </div>
    </LetterFrame>
  );

  return (
    <FormModal
      open={open}
      title="Appointment Letter"
      subtitle={pageLabel}
      onClose={onClose}
      wide
      extraWide
      dark={dark}
      scrollBody={false}
    >
      <div className="flex flex-1 min-h-0 flex-col gap-4 p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StepBadge active={step === 1} onClick={() => setStep(1)}>
              Page 1
            </StepBadge>
            <StepBadge active={step === 2} onClick={() => setStep(2)}>
              Page 2
            </StepBadge>
          </div>
          {statusMessage ? (
            <p
              className={`text-sm font-medium ${
                statusMessage.toLowerCase().includes("fail") ||
                statusMessage.toLowerCase().includes("blocked") ||
                statusMessage.toLowerCase().includes("could not")
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              {statusMessage}
            </p>
          ) : null}
        </div>

        <div ref={viewportRef} className="flex flex-1 min-h-0 items-start justify-center overflow-hidden">
          <div
            className="flex items-start justify-center overflow-hidden"
            style={{
              width: `${PAGE_BASE_WIDTH * scale}px`,
              height: `${PAGE_BASE_HEIGHT * scale}px`,
            }}
          >
            <div
              style={{
                width: `${PAGE_BASE_WIDTH}px`,
                height: `${PAGE_BASE_HEIGHT}px`,
                transform: `scale(${scale})`,
                transformOrigin: "top center",
              }}
            >
              {step === 1 ? pageOne : pageTwo}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                onClose();
                return;
              }
              setStep(1);
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {step === 1 ? "Close" : "Back"}
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl bg-[#123f9b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(18,63,155,0.22)] transition hover:bg-[#0f3380]"
            >
              Next
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="rounded-xl border border-[#123f9b]/20 bg-[#123f9b]/5 px-5 py-2.5 text-sm font-semibold text-[#123f9b] transition hover:bg-[#123f9b]/10 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={printDraft}
                className="rounded-xl bg-[#123f9b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(18,63,155,0.22)] transition hover:bg-[#0f3380]"
              >
                Print
              </button>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
