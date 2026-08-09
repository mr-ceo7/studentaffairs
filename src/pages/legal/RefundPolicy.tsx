import React, { useEffect } from 'react';

export default function RefundPolicy() {
  useEffect(() => {
    document.title = 'Refund Policy - WinviRahisi';
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl text-slate-300">
      <h1 className="text-3xl font-display font-bold text-white mb-6">Refund & Cancellation Policy</h1>
      <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">1. Digital Goods and Services</h2>
          <p>
            WinviRahisi is a provider of digital intelligence services, specifically premium sports predictions and related analytical data. Due to the immediate and intangible nature of these digital goods, all sales are considered final. Once our premium tips have been accessed or delivered, the transaction cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">2. Strictly NO Refunds</h2>
          <p>
            We adhere to a strict <strong className="text-white">NO REFUND</strong> policy on all subscriptions. WinviRahisi provides expert intelligence but we do not guarantee exact outcomes of sporting events. Financial losses resulting from utilizing our platform's insights do not entitle users to a refund of their subscription fees.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">3. Billing & Expirations</h2>
          <p>
            All WinviRahisi subscription plans are strictly one-time prepaid accesses. We do not engage in any auto-renewal matrices. Once your prepaid duration lapses, access is automatically gracefully revoked until a manual renewal happens. Since we do not auto-renew, the concept of "subscription cancellation" does not apply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">4. Fraudulent Transactions</h2>
          <p>
            In instances of clear fraudulent transactions processed without the account owner's authorization, please immediately contact your payment provider and then our support team at <a href="mailto:winvirahisi@gmail.com" className="text-indigo-400 hover:text-indigo-300">winvirahisi@gmail.com</a> for investigation.
          </p>
        </section>
      </div>
    </div>
  );
}
