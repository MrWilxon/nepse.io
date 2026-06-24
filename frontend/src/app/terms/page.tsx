"use client";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Terms of Service</h1>
        <p className="text-sm text-muted-theme mt-1">Last updated: June 2026</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-body-theme">
        <section>
          <h2 className="text-lg font-semibold text-primary-theme">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            By accessing or using NEPSE.io, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">2. Description of Service</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            NEPSE.io provides free analytics tools for the Nepal Stock Exchange (NEPSE), including:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Stock market data and price information</li>
            <li>Technical analysis tools and indicators</li>
            <li>Stock screening and filtering</li>
            <li>Portfolio tracking and management</li>
            <li>Paper trading simulation</li>
            <li>AI-powered price predictions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">3. Not Financial Advice</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            <strong className="text-body-theme">NEPSE.io is for informational and educational purposes only.</strong> 
            Nothing on this platform constitutes financial advice, investment recommendations, or solicitation 
            to buy or sell securities. Always consult a qualified financial advisor before making investment decisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">4. User Responsibilities</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            You are responsible for:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Maintaining the confidentiality of your account</li>
            <li>All activities that occur under your account</li>
            <li>Ensuring your use complies with applicable laws</li>
            <li>Not using the platform for any illegal purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">5. Data Accuracy</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            While we strive to provide accurate and up-to-date information, we make no warranties about 
            the completeness, reliability, or accuracy of data. Stock market data may be delayed or 
            contain errors. Always verify data with official sources (NEPSE) before making decisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">6. Limitation of Liability</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            NEPSE.io and its operators shall not be liable for any direct, indirect, incidental, 
            consequential, or punitive damages arising from your use of the platform, including but 
            not limited to investment losses, data inaccuracies, or service interruptions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">7. Intellectual Property</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            The platform design, code, and original content are owned by NEPSE.io. Stock market data 
            is sourced from public sources and is not owned by us. You may not reproduce, distribute, 
            or create derivative works without our written permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">8. Prohibited Uses</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            You may not:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Use automated tools to scrape or extract data</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the platform</li>
            <li>Use the platform for commercial purposes without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">9. Changes to Terms</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We reserve the right to modify these terms at any time. Continued use of the platform 
            after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">10. Contact</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            For questions about these Terms of Service, please contact us through our platform.
          </p>
        </section>
      </div>
    </div>
  );
}
