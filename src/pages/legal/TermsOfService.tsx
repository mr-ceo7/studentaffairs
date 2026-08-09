import React, { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service - UoN Clearinghouse';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl text-slate-700">
      <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-6">Terms of Service</h1>
      <p className="mb-4 text-xs text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-xs leading-relaxed">
        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the University of Nairobi (UoN) Academic Grievance Clearinghouse portal, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the clearance portal.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">2. Description of Portal Service</h2>
          <p>
            The UoN Clearinghouse is a web-based, role-gated platform built to resolve missing marks, CAT discrepancies, and academic grade grievances. The platform connects students, course lecturers, and department HODs / Registrars to update Student Management System (SMS) records.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">3. Academic Honesty & Disclaimer</h2>
          <p>
            When submitting a claim, students are strictly required to attach authentic proof documents (e.g. graded scripts, stamped exam cards, invigilation dockets). In compliance with the University of Nairobi Senate regulations, submitting forged, modified, or plagiarized proof files constitutes academic fraud. Any suspected academic misconduct will be reported to the Faculty disciplinary board and may result in immediate suspension or expulsion.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">4. Account Responsibilities</h2>
          <p>
            Access is gated via Google SSO restricted to `@student.uonbi.ac.ke` and `@uonbi.ac.ke` email domains. You are responsible for keeping your session active and logging out when accessing the portal from shared computer labs. Sharing accounts or attempting unauthorized access to registrar panels is strictly prohibited.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">5. Governing Bylaws</h2>
          <p>
            These Terms of Service and your use of the portal shall be governed and interpreted under the University of Nairobi Senate bylaws and the laws of the Republic of Kenya.
          </p>
        </section>
      </div>
    </div>
  );
}
