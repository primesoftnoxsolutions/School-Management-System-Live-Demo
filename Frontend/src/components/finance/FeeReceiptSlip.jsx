export default function FeeReceiptSlip({ slip, onClose }) {
  if (!slip) return null;

  const printSlip = () => window.print();

  return (
    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm print:bg-white print:p-0">
      <div
        className="modal-panel-enter w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 print:max-w-none print:animate-none print:shadow-none print:ring-0"
        id="fee-receipt-slip"
      >
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-8 text-white print:bg-blue-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white" />
            <div className="absolute -bottom-6 left-10 h-20 w-20 rounded-full bg-white" />
          </div>
          <div className="relative text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
              <span className="text-2xl font-bold">N</span>
            </div>
            <h3 className="text-xl font-bold tracking-wide">{slip.schoolName}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-blue-100">Official Fee Receipt</p>
            <div className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-medium">
              {slip.receiptNo}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-slate-500">Payment Date</span>
            <span className="font-semibold text-slate-800">{new Date(slip.paidAt).toLocaleString()}</span>
          </div>

          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-lg font-bold text-slate-900">
              {slip.student?.firstName} {slip.student?.lastName}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Class: {slip.student?.className} - {slip.student?.section} | Roll: {slip.student?.rollNumber || "-"}
            </p>
            <p className="text-xs text-slate-500">Father: {slip.student?.fatherName || slip.student?.guardianName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Fee Type</p>
              <p className="font-semibold text-slate-800">{slip.feeType}</p>
            </div>
            {slip.month ? (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Month</p>
                <p className="font-semibold text-slate-800">{slip.month}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-dashed border-slate-200 pt-4">
            <div className="flex justify-between text-slate-600">
              <span>Amount</span>
              <span>Rs. {slip.amount?.toLocaleString()}</span>
            </div>
            {slip.discount > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>- Rs. {slip.discount?.toLocaleString()}</span>
              </div>
            ) : null}
            {slip.fineAmount > 0 ? (
              <div className="flex justify-between text-rose-600">
                <span>Late Fine</span>
                <span>+ Rs. {slip.fineAmount?.toLocaleString()}</span>
              </div>
            ) : null}
            <div className="flex justify-between rounded-xl bg-blue-50 px-4 py-3 text-lg font-bold text-blue-900">
              <span>Net Paid</span>
              <span>Rs. {slip.netAmount?.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span>Payment Method</span>
            <span className="font-medium">{slip.paymentMethod}</span>
          </div>
          {slip.remarks ? <p className="text-xs text-slate-500">Remarks: {slip.remarks}</p> : null}

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">Received by: {slip.receivedBy}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-300">Thank you for your payment</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <button type="button" className="ref-btn-outline" onClick={onClose}>
            Close
          </button>
          <button type="button" className="ref-btn-primary" onClick={printSlip}>
            Print Slip
          </button>
        </div>
      </div>
    </div>
  );
}
