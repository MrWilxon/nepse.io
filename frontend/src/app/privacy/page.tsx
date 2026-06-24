"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Privacy Policy</h1>
        <p className="text-sm text-muted-theme mt-1">Last updated: June 2026</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-body-theme">
        <section>
          <h2 className="text-lg font-semibold text-primary-theme">1. Information We Collect</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            NEPSE.io is a free analytics platform. We collect minimal information to provide our services:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li><strong className="text-body-theme">Usage Data:</strong> Anonymous analytics about how you use the platform (pages visited, features used)</li>
            <li><strong className="text-body-theme">Local Storage:</strong> Your preferences (theme, watchlist, favorites) are stored locally in your browser</li>
            <li><strong className="text-body-theme">Portfolio Data:</strong> If you use portfolio features, your holdings are stored in our database</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">2. How We Use Information</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We use collected information to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Improve our platform and user experience</li>
            <li>Provide personalized features (watchlist, portfolio tracking)</li>
            <li>Analyze usage patterns to enhance performance</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">3. Data Storage</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            Your portfolio and watchlist data are stored securely in our database. We use industry-standard 
            security measures to protect your information. Local storage data never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">4. Third-Party Services</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li><strong className="text-body-theme">Google AdSense:</strong> To display advertisements. Google may collect data for ad personalization</li>
            <li><strong className="text-body-theme">Supabase:</strong> For database hosting and data storage</li>
            <li><strong className="text-body-theme">Render.com:</strong> For backend hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">5. Cookies</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We use essential cookies for functionality. Third-party services (Google AdSense) may use 
            cookies for ad personalization. You can control cookie settings in your browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">6. Data Sharing</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We do not sell, trade, or otherwise transfer your personal information to third parties. 
            We may share anonymized, aggregated data for research or analytics purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">7. Your Rights</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Access your personal data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of data collection</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">8. Changes to This Policy</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We may update this privacy policy from time to time. Changes will be posted on this page 
            with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">9. Contact Us</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            If you have questions about this privacy policy, please contact us through our platform.
          </p>
        </section>
      </div>
    </div>
  );
}
