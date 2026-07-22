const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

function CornerOrnament({ className = "" }) {
  return (
    <svg className={`h-9 w-9 text-amber-600/75 sm:h-10 sm:w-10 ${className}`} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M2 2h12v2H4v10H2V2z" fill="currentColor" />
      <path d="M2 2c8 4 14 10 18 18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-dashed border-slate-200 py-2.5 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-full shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:w-44">
        {label}
      </span>
      <span className="flex-1 text-sm font-semibold text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default function LeavingCertificatePreview({ cert, onClose }) {
  if (!cert) return null;
  const isCharacter = cert.certificateType === "CHARACTER";
  const certificateTitle = isCharacter ? "Character Certificate" : "School Leaving Certificate";
  const schoolName = "Insaaf Grammar High School";
  const admissionNumber = cert.studentId?.admissionNo || cert.admissionNo || "—";

  const printCert = () => {
    const html = document.getElementById("leaving-certificate-print")?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=920,height=1100");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${cert.certificateNo}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Georgia,'Times New Roman',serif;background:#fff;padding:28px;color:#1e293b}
        .cert{border:3px double #1e3a5f;padding:5px}
        .inner{border:1px solid #b45309;padding:36px 44px;position:relative;background:#fffdf8}
        .wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:92px;font-weight:bold;opacity:.04;pointer-events:none}
        .head{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:22px;margin-bottom:26px}
        .logo{width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;font-size:30px;font-weight:bold;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:3px solid #fbbf24}
        h1{font-size:24px;color:#1e3a5f;letter-spacing:.1em;text-transform:uppercase}
        .sub{font-size:13px;color:#64748b;margin-top:5px;font-style:italic}
        .contact{font-size:11px;color:#94a3b8;margin-top:3px}
        .divider{margin:18px auto;width:140px;height:1px;background:#d97706;opacity:.5}
        .title{margin-top:14px;font-size:17px;letter-spacing:.24em;text-transform:uppercase;color:#92400e;font-weight:bold}
        .no{font-size:11px;color:#64748b;margin-top:8px}
        .intro{font-size:14px;line-height:1.85;text-align:justify;margin-bottom:22px}
        .box{background:linear-gradient(135deg,#f8fafc,#fff);border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;margin:22px 0}
        .row{display:flex;border-bottom:1px dashed #e2e8f0;padding:9px 0;font-size:13px}
        .row:last-child{border-bottom:none}
        .lbl{width:170px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#64748b;font-weight:700}
        .val{flex:1;font-weight:600;color:#0f172a}
        .close{margin-top:22px;text-align:center;font-size:13px;font-style:italic;color:#475569}
        .foot{margin-top:34px;padding-top:22px;border-top:2px solid #1e3a5f;display:flex;justify-content:space-between;align-items:flex-end}
        .stamp{width:76px;height:76px;border:2px dashed #93c5fd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#3b82f6;text-align:center;margin:0 0 10px auto;line-height:1.3}
        .line{width:170px;border-bottom:1px solid #334155;margin:0 0 5px auto}
        .sign{text-align:right;font-weight:bold;font-size:13px}
        .sign-sub{text-align:right;font-size:11px;color:#64748b}
        .issued{font-size:11px;color:#64748b;line-height:1.6}
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 450);
  };

  const printBody = (
    <div className="cert">
      <div className="inner">
          <div className="wm">IGHS</div>
        <header className="head">
          <div className="logo">I</div>
          <h1>{schoolName}</h1>
          <p className="sub">Official Academic Certificate</p>
          <p className="contact">Main Campus, City — Phone: +92 300 0000000</p>
          <div className="divider" />
          <p className="title">{certificateTitle}</p>
          <p className="no">Certificate No: {cert.certificateNo}</p>
        </header>
        <div>
          <p className="intro">
            This is to certify that <strong>{cert.studentName}</strong>, son/daughter of{" "}
            <strong>{cert.fatherName || "—"}</strong>, Admission No. <strong>{admissionNumber}</strong>,
            Roll No. <strong>{cert.rollNumber || "—"}</strong>, was a bonafide student of this institution and this
            {isCharacter ? " character certificate " : " school leaving certificate "}is issued as per school record.
          </p>
          <div className="box">
            <div className="row"><span className="lbl">Student Name</span><span className="val">{cert.studentName}</span></div>
            <div className="row"><span className="lbl">Father / Guardian</span><span className="val">{cert.fatherName || "—"}</span></div>
            <div className="row"><span className="lbl">Admission Number</span><span className="val">{admissionNumber}</span></div>
            <div className="row"><span className="lbl">Roll Number</span><span className="val">{cert.rollNumber || "—"}</span></div>
            <div className="row"><span className="lbl">Class</span><span className="val">{cert.className} — Section {cert.section || "A"}</span></div>
            <div className="row"><span className="lbl">Academic Stream</span><span className="val">{cert.academicStream || "—"}</span></div>
            <div className="row"><span className="lbl">Date of Birth</span><span className="val">{formatDate(cert.dateOfBirth)}</span></div>
            <div className="row"><span className="lbl">Date of Admission</span><span className="val">{formatDate(cert.dateOfAdmission)}</span></div>
            <div className="row"><span className="lbl">Date of Leaving</span><span className="val">{formatDate(cert.dateOfLeaving)}</span></div>
            {!isCharacter ? <div className="row"><span className="lbl">Last Attendance Date</span><span className="val">{formatDate(cert.lastAttendanceDate)}</span></div> : null}
            <div className="row"><span className="lbl">Conduct & Character</span><span className="val">{cert.conduct}</span></div>
            {isCharacter ? <div className="row"><span className="lbl">Academic Performance</span><span className="val">{cert.academicPerformance || "Academic record maintained by school"}</span></div> : null}
            {isCharacter ? <div className="row"><span className="lbl">Attendance Remarks</span><span className="val">{cert.attendanceRemarks || "Attendance record maintained by school"}</span></div> : null}
            <div className="row"><span className="lbl">Reason for Leaving</span><span className="val">{cert.reasonForLeaving}</span></div>
            {!isCharacter ? <div className="row"><span className="lbl">Fees Status</span><span className="val">{cert.feesStatus || "—"}</span></div> : null}
            {!isCharacter ? <div className="row"><span className="lbl">Promotion Status</span><span className="val">{cert.promotionStatus || "—"}</span></div> : null}
            {cert.remarks ? <div className="row"><span className="lbl">Remarks</span><span className="val">{cert.remarks}</span></div> : null}
          </div>
          <p className="close">
            We certify the above particulars are correct to the best of our knowledge and wish the student every success in future endeavours.
          </p>
        </div>
        <footer className="foot">
          <div className="issued">
            <p><strong>Issued on:</strong> {formatDate(cert.issueDate || cert.createdAt || new Date())}</p>
            <p style={{ marginTop: 6, maxWidth: 240 }}>Official computer-generated certificate — {schoolName}.</p>
          </div>
          <div>
            <div className="stamp">OFFICIAL<br />SEAL</div>
            <div className="line" />
            <p className="sign">Principal</p>
            <p className="sign-sub">{schoolName}</p>
          </div>
        </footer>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 px-3 py-6 backdrop-blur-sm">
      <div className="modal-panel-enter flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Screen preview — Tailwind styled */}
          <div className="relative mx-auto max-w-3xl border-[3px] border-double border-[#1e3a5f] bg-[#fffdf8] p-1.5 shadow-inner">
            <div className="relative border border-amber-600/50 px-5 py-8 sm:px-10 sm:py-10">
              <CornerOrnament className="absolute left-2 top-2 sm:left-3 sm:top-3" />
              <CornerOrnament className="absolute right-2 top-2 rotate-90 sm:right-3 sm:top-3" />
              <CornerOrnament className="absolute bottom-2 left-2 -rotate-90 sm:bottom-3 sm:left-3" />
              <CornerOrnament className="absolute bottom-2 right-2 rotate-180 sm:bottom-3 sm:right-3" />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                <span className="select-none text-7xl font-bold uppercase tracking-[0.3em] text-slate-900/[0.035] sm:text-8xl">
                  IGHS
                </span>
              </div>

              <header className="relative z-10 border-b-2 border-[#1e3a5f] pb-6 text-center">
                <div className="mx-auto mb-3 flex h-[70px] w-[70px] items-center justify-center rounded-full border-[3px] border-amber-400 bg-gradient-to-br from-[#1e3a5f] via-blue-800 to-blue-600 text-3xl font-bold text-white shadow-md">
                  I
                </div>
                <h2 className="font-serif text-xl font-bold uppercase tracking-[0.1em] text-[#1e3a5f] sm:text-2xl">
                  {schoolName}
                </h2>
                <p className="mt-1.5 text-sm italic text-slate-600">Official Academic Certificate</p>
                <p className="text-xs text-slate-400">Main Campus, City — Phone: +92 300 0000000</p>
                <div className="mx-auto mt-5 flex w-40 items-center justify-center gap-2">
                  <span className="h-px flex-1 bg-amber-500/50" />
                  <span className="text-[10px] text-amber-700">✦</span>
                  <span className="h-px flex-1 bg-amber-500/50" />
                </div>
                <p className="mt-4 font-serif text-base font-bold uppercase tracking-[0.22em] text-amber-800 sm:text-lg">
                  {certificateTitle}
                </p>
                <p className="mt-2 text-xs text-slate-500">Certificate No: {cert.certificateNo}</p>
              </header>

              <div className="relative z-10 mt-7">
                <p className="text-justify text-sm leading-8 text-slate-700 sm:text-[15px]">
                  This is to certify that{" "}
                  <strong className="font-semibold text-slate-900 underline decoration-amber-400/50 decoration-2 underline-offset-2">
                    {cert.studentName}
                  </strong>
                  , son/daughter of <strong className="text-slate-900">{cert.fatherName || "—"}</strong>, bearing Roll
                  No. <strong className="text-slate-900">{cert.rollNumber || "—"}</strong>, was a bonafide student of
                  this institution and this {certificateTitle.toLowerCase()} is issued as per school record.
                </p>

                <div className="mt-5 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white px-4 py-1 shadow-sm sm:px-5">
                  <DetailRow label="Student Name" value={cert.studentName} />
                  <DetailRow label="Father / Guardian" value={cert.fatherName || "—"} />
                  <DetailRow label="Admission Number" value={admissionNumber} />
                  <DetailRow label="Roll Number" value={cert.rollNumber || "—"} />
                  <DetailRow label="Class" value={`${cert.className} — Section ${cert.section || "A"}`} />
                  <DetailRow label="Academic Stream" value={cert.academicStream} />
                  <DetailRow label="Date of Birth" value={formatDate(cert.dateOfBirth)} />
                  <DetailRow label="Date of Admission" value={formatDate(cert.dateOfAdmission)} />
                  <DetailRow label="Date of Leaving" value={formatDate(cert.dateOfLeaving)} />
                  {!isCharacter ? <DetailRow label="Last Attendance Date" value={formatDate(cert.lastAttendanceDate)} /> : null}
                  <DetailRow label="Conduct & Character" value={cert.conduct} />
                  {isCharacter ? <DetailRow label="Academic Performance" value={cert.academicPerformance || "Academic record maintained by school"} /> : null}
                  {isCharacter ? <DetailRow label="Attendance Remarks" value={cert.attendanceRemarks || "Attendance record maintained by school"} /> : null}
                  <DetailRow label="Reason for Leaving" value={cert.reasonForLeaving} />
                  {!isCharacter ? <DetailRow label="Fees Status" value={cert.feesStatus || "—"} /> : null}
                  {!isCharacter ? <DetailRow label="Promotion Status" value={cert.promotionStatus || "—"} /> : null}
                  {cert.remarks ? <DetailRow label="Remarks" value={cert.remarks} /> : null}
                </div>

                <p className="mt-6 text-center text-sm italic leading-relaxed text-slate-600">
                  We certify the above particulars are correct to the best of our knowledge and wish the student every
                  success in future endeavours.
                </p>
              </div>

              <footer className="relative z-10 mt-9 flex flex-col gap-8 border-t-2 border-[#1e3a5f] pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-xs leading-relaxed text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-600">Issued on:</span>{" "}
                    {formatDate(cert.issueDate || cert.createdAt || new Date())}
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-400">
                    Official computer-generated certificate — {schoolName}.
                  </p>
                </div>
                <div className="flex flex-col items-center sm:items-end">
                  <div className="relative mb-2 flex h-[76px] w-[76px] items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-300" />
                    <div className="absolute inset-1.5 rounded-full border border-blue-200/70" />
                    <p className="text-center text-[8px] font-bold uppercase leading-tight tracking-wider text-blue-600">
                      Official
                      <br />
                      Seal
                    </p>
                  </div>
                  <div className="mb-1 w-44 border-b border-slate-700" />
                  <p className="text-sm font-bold text-slate-800">Principal</p>
                  <p className="text-xs text-slate-500">{schoolName}</p>
                </div>
              </footer>
            </div>
          </div>

          {/* Hidden print source */}
          <div id="leaving-certificate-print" className="hidden" aria-hidden>
            {printBody}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" className="ref-btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="ref-btn-primary" onClick={printCert}>
            Print Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
