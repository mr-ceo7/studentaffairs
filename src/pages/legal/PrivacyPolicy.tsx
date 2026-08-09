import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - UoN Clearinghouse';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl text-slate-700">
      <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-6">Privacy Policy</h1>
      <p className="mb-4 text-xs text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-xs leading-relaxed">
        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">1. Information We Collect</h2>
          <p>
            When you use the UoN Clearinghouse, we collect information required to verify academic records. If you authenticate using Google Single Sign-On (SSO), we collect your name, university email address (`@student.uonbi.ac.ke` or `@uonbi.ac.ke`), and profile picture provided dynamically by Google. Additionally, we store academic data you submit, including your student registration number, department, course unit codes, claimed grades, and uploaded proof documents (e.g., dockets or exam cards).
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">2. How We Use Your Information</h2>
          <p>
            We use the academic and personal information collected to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-500">
            <li>Provide, operate, and maintain the marks clearance and academic dispute pipeline.</li>
            <li>Enable unit lecturers and Heads of Departments to inspect and verify grade documents.</li>
            <li>Maintain session authentication checks for role-gated access.</li>
            <li>Send email/SMS status notifications regarding your ticket updates.</li>
          </ul>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">3. Data Minimization & Security</h2>
          <p>
            In compliance with academic privacy regulations, the platform does not collect national ID numbers, passwords, bank accounts, or telephone numbers. All uploads are renamed using a secure identifier scheme, and access is strictly permission-scoped to you, the course lecturer, and authorized faculty board members.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">4. Cookies and Session Storage</h2>
          <p>
            We use secure session cookies solely for user verification and portal navigation security.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">5. Data Retention</h2>
          <p>
            Academic claim records are retained in compliance with the university's data preservation policies. Completed claims are archived after each graduation cycle.
          </p>
        </section>

        <section className="bg-white/70 border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3">6. Contact & Support</h2>
          <p>
            For privacy inquiries or requests to review your records, please reach out directly to the Office of the Academic Registrar or contact our helpdesk.
          </p>
        </section>
      </div>
    </div>
  );
}
