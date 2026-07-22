import { createPortal } from "react-dom";

const SCHOOL_LOGO = "/Logo%20Insaf%20Grammar%20High%20School.png";

const FORM_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .af-root, .af-root * {
    font-family: "Times New Roman", Times, serif;
    color: #000;
  }
  .af-sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 12mm 15mm 10mm;
    background: #fff;
  }
  .af-header {
    position: relative;
    text-align: center;
    min-height: 78px;
    margin-bottom: 2px;
  }
  .af-school-name {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.035em;
    line-height: 1.1;
    text-transform: uppercase;
    padding: 10px 90px 0 16px;
  }
  .af-logo {
    position: absolute;
    top: 0;
    right: 0;
    width: 82px;
    height: 82px;
    object-fit: contain;
  }
  .af-form-title {
    text-align: center;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    margin: 2px 0 8px;
  }
  .af-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 16px;
    gap: 12px;
  }
  .af-meta-item {
    display: flex;
    align-items: flex-end;
    gap: 6px;
  }
  .af-meta-item .af-line {
    display: inline-block;
    width: 110px;
    border-bottom: 1.5px solid #000;
    min-height: 18px;
  }
  .af-field {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 13px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.15;
  }
  .af-field .af-label { flex-shrink: 0; white-space: nowrap; }
  .af-field .af-line {
    flex: 1;
    border-bottom: 1.5px solid #000;
    min-height: 20px;
  }
  .af-row {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 13px;
    font-size: 15px;
    font-weight: 700;
  }
  .af-inline {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .af-inline .af-label { flex-shrink: 0; white-space: nowrap; }
  .af-inline .af-line {
    flex: 1;
    border-bottom: 1.5px solid #000;
    min-height: 20px;
  }
  .af-dob-row, .af-gender-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 13px;
    font-size: 15px;
    font-weight: 700;
  }
  .af-dob-boxes {
    display: inline-flex;
    border: 1.5px solid #000;
  }
  .af-dob-box {
    width: 48px;
    height: 26px;
    border-right: 1.5px solid #000;
  }
  .af-dob-box:last-child {
    width: 68px;
    border-right: 0;
  }
  .af-gender-opts {
    display: flex;
    align-items: center;
    gap: 26px;
  }
  .af-bullet::before {
    content: "•";
    margin-right: 6px;
  }
  .af-cnic-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 13px;
    font-size: 15px;
    font-weight: 700;
  }
  .af-cnic-row .af-label { flex-shrink: 0; white-space: nowrap; }
  .af-cnic-row .af-line {
    flex: 1;
    border-bottom: 1.5px solid #000;
    min-height: 20px;
    max-width: 160px;
  }
  .af-occ-boxes {
    display: flex;
    flex: 1.4;
    border: 1.5px solid #000;
    min-width: 0;
  }
  .af-occ-box {
    flex: 1;
    text-align: center;
    font-size: 12.5px;
    font-weight: 700;
    padding: 6px 2px;
    border-right: 1.5px solid #000;
    white-space: nowrap;
  }
  .af-occ-box:last-child { border-right: 0; }
  .af-docs-title {
    font-size: 15px;
    font-weight: 700;
    text-decoration: underline;
    margin: 4px 0 8px;
  }
  .af-docs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px 24px;
    margin-bottom: 14px;
    font-size: 14px;
    font-weight: 600;
  }
  .af-docs-grid li {
    list-style: none;
    position: relative;
    padding-left: 14px;
  }
  .af-docs-grid li::before {
    content: "•";
    position: absolute;
    left: 0;
    top: 0;
  }
  .af-cert-bar {
    background: #000;
    color: #fff;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 7px 10px;
    margin-bottom: 10px;
  }
  .af-cert-box {
    border: 1.8px solid #000;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.55;
    margin-bottom: 16px;
  }
  .af-cert-line {
    display: inline-block;
    min-width: 240px;
    border-bottom: 1.5px solid #000;
    margin: 0 6px 2px;
    vertical-align: baseline;
  }
  .af-sign-row {
    display: flex;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 26px;
    font-size: 15px;
    font-weight: 700;
  }
  .af-sign-item {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    flex: 1;
  }
  .af-sign-item .af-line {
    flex: 1;
    border-bottom: 1.5px solid #000;
    min-height: 20px;
  }
  .af-principal {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    font-size: 15px;
    font-weight: 700;
  }
  .af-principal-item {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    width: 250px;
  }
  .af-principal-item .af-line {
    flex: 1;
    border-bottom: 1.5px solid #000;
    min-height: 20px;
  }
`;

const PRINT_PAGE_CSS = `
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    .af-sheet { width: 210mm; min-height: 297mm; padding: 11mm 14mm 9mm; }
  }
`;

function AdmissionFormMarkup({ logoSrc }) {
  return (
    <div className="af-root">
      <div className="af-sheet">
        <div className="af-header">
          <div className="af-school-name">INSAF GRAMMER HIGH SCHOOL®</div>
          <img className="af-logo" src={logoSrc} alt="Insaf Grammar High School logo" />
        </div>

        <div className="af-form-title">A D M I S S I O N&nbsp;&nbsp;F O R M</div>

        <div className="af-meta-row">
          <div className="af-meta-item">
            <span>ADMISSION No.</span>
            <span className="af-line" />
          </div>
          <div className="af-meta-item">
            <span>/ DATE:</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-field">
          <span className="af-label">Full Name (In Capital)</span>
          <span className="af-line" />
        </div>
        <div className="af-field">
          <span className="af-label">Father&apos;s Name (In Capital)</span>
          <span className="af-line" />
        </div>

        <div className="af-dob-row">
          <span>DOB (Day, Month, Year)</span>
          <div className="af-dob-boxes" aria-hidden>
            <div className="af-dob-box" />
            <div className="af-dob-box" />
            <div className="af-dob-box" />
          </div>
        </div>

        <div className="af-gender-row">
          <span>Gender: -</span>
          <div className="af-gender-opts">
            <span className="af-bullet">Male</span>
            <span className="af-bullet">Female</span>
          </div>
        </div>

        <div className="af-field">
          <span className="af-label">Full Address</span>
          <span className="af-line" />
        </div>

        <div className="af-row">
          <div className="af-inline">
            <span className="af-label">Class of Admission:</span>
            <span className="af-line" />
          </div>
          <div className="af-inline">
            <span className="af-label">Previous School</span>
            <span className="af-line" />
          </div>
          <div className="af-inline" style={{ flex: 0.85 }}>
            <span className="af-label">Name:</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-row">
          <div className="af-inline">
            <span className="af-label">Religion:</span>
            <span className="af-line" />
          </div>
          <div className="af-inline">
            <span className="af-label">Nationality:</span>
            <span className="af-line" />
          </div>
          <div className="af-inline">
            <span className="af-label">Cast:</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-field">
          <span className="af-label">Father/Guardian&apos;s Name</span>
          <span className="af-line" />
        </div>

        <div className="af-row">
          <div className="af-inline">
            <span className="af-label">Home Phone:</span>
            <span className="af-line" />
          </div>
          <div className="af-inline" style={{ flex: 1.25 }}>
            <span className="af-label">Cell Phone Watsup no.</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-field">
          <span className="af-label">Father/ Guardian Occupation</span>
          <span className="af-line" />
        </div>

        <div className="af-cnic-row">
          <span className="af-label">Father/ Guardian CNIC NO.</span>
          <span className="af-line" />
          <div className="af-occ-boxes">
            <div className="af-occ-box">Govt.</div>
            <div className="af-occ-box">Private</div>
            <div className="af-occ-box">Business</div>
            <div className="af-occ-box">Other</div>
            <div className="af-occ-box">Agriculture</div>
          </div>
        </div>

        <div className="af-row">
          <div className="af-inline">
            <span className="af-label">Admission Fee:</span>
            <span className="af-line" />
          </div>
          <div className="af-inline">
            <span className="af-label">Tuition Fee</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-docs-title">Document Required:</div>
        <ul className="af-docs-grid">
          <li>Copy of last 2 Term&apos;s Report Cards</li>
          <li>2 Passport Size Photographs</li>
          <li>Copy of Birth Certificate and Passport</li>
          <li>Copy of CNIC Card of Father/Guardian</li>
        </ul>

        <div className="af-cert-bar">CERTIFICATE FROM THE PARENT</div>
        <div className="af-cert-box">
          I <span className="af-cert-line" /> Certified that the date of birth given above is correct to the best of
          my knowledge and belief and is in accordance with
        </div>

        <div className="af-sign-row">
          <div className="af-sign-item">
            <span>Student Signature</span>
            <span className="af-line" />
          </div>
          <div className="af-sign-item">
            <span>Father/Guardian Signature</span>
            <span className="af-line" />
          </div>
        </div>

        <div className="af-principal">
          <div className="af-principal-item">
            <span>Principal</span>
            <span className="af-line" />
          </div>
          <div className="af-principal-item">
            <span>Signature</span>
            <span className="af-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPrintDocument() {
  const logoAbs = `${window.location.origin}${SCHOOL_LOGO}`;
  const formHtml = `
  <div class="af-root">
    <div class="af-sheet">
      <div class="af-header">
        <div class="af-school-name">INSAF GRAMMER HIGH SCHOOL®</div>
        <img class="af-logo" src="${logoAbs}" alt="Insaf Grammar High School logo" />
      </div>
      <div class="af-form-title">A D M I S S I O N&nbsp;&nbsp;F O R M</div>
      <div class="af-meta-row">
        <div class="af-meta-item"><span>ADMISSION No.</span><span class="af-line"></span></div>
        <div class="af-meta-item"><span>/ DATE:</span><span class="af-line"></span></div>
      </div>
      <div class="af-field"><span class="af-label">Full Name (In Capital)</span><span class="af-line"></span></div>
      <div class="af-field"><span class="af-label">Father's Name (In Capital)</span><span class="af-line"></span></div>
      <div class="af-dob-row">
        <span>DOB (Day, Month, Year)</span>
        <div class="af-dob-boxes"><div class="af-dob-box"></div><div class="af-dob-box"></div><div class="af-dob-box"></div></div>
      </div>
      <div class="af-gender-row">
        <span>Gender: -</span>
        <div class="af-gender-opts"><span class="af-bullet">Male</span><span class="af-bullet">Female</span></div>
      </div>
      <div class="af-field"><span class="af-label">Full Address</span><span class="af-line"></span></div>
      <div class="af-row">
        <div class="af-inline"><span class="af-label">Class of Admission:</span><span class="af-line"></span></div>
        <div class="af-inline"><span class="af-label">Previous School</span><span class="af-line"></span></div>
        <div class="af-inline" style="flex:0.85"><span class="af-label">Name:</span><span class="af-line"></span></div>
      </div>
      <div class="af-row">
        <div class="af-inline"><span class="af-label">Religion:</span><span class="af-line"></span></div>
        <div class="af-inline"><span class="af-label">Nationality:</span><span class="af-line"></span></div>
        <div class="af-inline"><span class="af-label">Cast:</span><span class="af-line"></span></div>
      </div>
      <div class="af-field"><span class="af-label">Father/Guardian's Name</span><span class="af-line"></span></div>
      <div class="af-row">
        <div class="af-inline"><span class="af-label">Home Phone:</span><span class="af-line"></span></div>
        <div class="af-inline" style="flex:1.25"><span class="af-label">Cell Phone Watsup no.</span><span class="af-line"></span></div>
      </div>
      <div class="af-field"><span class="af-label">Father/ Guardian Occupation</span><span class="af-line"></span></div>
      <div class="af-cnic-row">
        <span class="af-label">Father/ Guardian CNIC NO.</span>
        <span class="af-line"></span>
        <div class="af-occ-boxes">
          <div class="af-occ-box">Govt.</div>
          <div class="af-occ-box">Private</div>
          <div class="af-occ-box">Business</div>
          <div class="af-occ-box">Other</div>
          <div class="af-occ-box">Agriculture</div>
        </div>
      </div>
      <div class="af-row">
        <div class="af-inline"><span class="af-label">Admission Fee:</span><span class="af-line"></span></div>
        <div class="af-inline"><span class="af-label">Tuition Fee</span><span class="af-line"></span></div>
      </div>
      <div class="af-docs-title">Document Required:</div>
      <ul class="af-docs-grid">
        <li>Copy of last 2 Term's Report Cards</li>
        <li>2 Passport Size Photographs</li>
        <li>Copy of Birth Certificate and Passport</li>
        <li>Copy of CNIC Card of Father/Guardian</li>
      </ul>
      <div class="af-cert-bar">CERTIFICATE FROM THE PARENT</div>
      <div class="af-cert-box">
        I <span class="af-cert-line"></span> Certified that the date of birth given above is correct to the best of
        my knowledge and belief and is in accordance with
      </div>
      <div class="af-sign-row">
        <div class="af-sign-item"><span>Student Signature</span><span class="af-line"></span></div>
        <div class="af-sign-item"><span>Father/Guardian Signature</span><span class="af-line"></span></div>
      </div>
      <div class="af-principal">
        <div class="af-principal-item"><span>Principal</span><span class="af-line"></span></div>
        <div class="af-principal-item"><span>Signature</span><span class="af-line"></span></div>
      </div>
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Admission Form - Insaf Grammar High School</title>
  <style>${FORM_CSS}${PRINT_PAGE_CSS}</style>
</head>
<body>${formHtml}</body>
</html>`;
}

export default function AdmissionFormPreview({ open, onClose }) {
  if (!open) return null;

  const printForm = () => {
    const win = window.open("", "_blank", "width=920,height=1100");
    if (!win) return;
    win.document.write(buildPrintDocument());
    win.document.close();
    win.focus();
    const triggerPrint = () => {
      try {
        win.print();
      } catch {
        // ignore
      }
    };
    const img = win.document.querySelector("img.af-logo");
    if (img && !img.complete) {
      img.onload = () => setTimeout(triggerPrint, 120);
      img.onerror = () => setTimeout(triggerPrint, 120);
      setTimeout(triggerPrint, 1200);
    } else {
      setTimeout(triggerPrint, 250);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 px-3 py-5 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[96vh] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Admission Form</h3>
            <p className="text-sm text-slate-500">Preview matches the printable school admission form.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close admission form"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 px-3 py-4 sm:px-5">
          <div className="mx-auto w-fit overflow-hidden rounded-sm border border-slate-300 bg-white shadow-md">
            <style>{FORM_CSS}</style>
            <AdmissionFormMarkup logoSrc={SCHOOL_LOGO} />
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button type="button" className="ref-btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="ref-btn-primary" onClick={printForm}>
            Print Form
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
