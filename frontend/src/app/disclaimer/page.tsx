"use client";

export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-theme">Disclaimer</h1>
        <p className="text-sm text-muted-theme mt-1">Last updated: June 2026</p>
      </div>

      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
          Important: Please read this disclaimer carefully before using NEPSE.io
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-body-theme">
        <section>
          <h2 className="text-lg font-semibold text-primary-theme">General Information</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            The information provided on NEPSE.io is for general informational and educational purposes only. 
            All data, analysis, and tools are provided &quot;as is&quot; without warranty of any kind.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Not Financial Advice</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            <strong className="text-body-theme">NEPSE.io does not provide financial advice.</strong> 
            Nothing on this platform should be construed as investment advice, a recommendation, 
            or an offer to buy or sell any security. The content is not tailored to any individual&apos;s 
            investment needs or financial situation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">AI Predictions</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            <strong className="text-body-theme">AI price predictions are for informational purposes only.</strong> 
            Our AI models use historical data and technical indicators to generate predictions. These predictions:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>Are not guarantees of future performance</li>
            <li>Should not be used as the sole basis for investment decisions</li>
            <li>May not account for fundamental factors, market events, or black swan events</li>
            <li>Past accuracy does not predict future accuracy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Data Accuracy</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            While we strive to provide accurate data, we make no representations or warranties about 
            the accuracy, completeness, or timeliness of information on this platform. Stock market data 
            may be delayed, and historical data may contain errors.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Investment Risk</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            <strong className="text-body-theme">Investing in the stock market involves significant risk.</strong> 
            You may lose some or all of your investment. Past performance does not guarantee future results. 
            Before investing, consider your investment objectives and risk tolerance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Paper Trading</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            Paper trading simulations use virtual money and do not involve real transactions. 
            Performance in paper trading does not indicate future results in real trading. 
            Real trading involves additional factors such as commissions, slippage, and market impact.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Third-Party Content</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            Our platform may contain links to third-party websites or services. We are not responsible 
            for the content, accuracy, or practices of external sites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">No Guarantees</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            We do not guarantee that:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-theme mt-2 space-y-1">
            <li>The platform will be available at all times</li>
            <li>The platform will be error-free</li>
            <li>You will achieve profitable results using our tools</li>
            <li>Our analysis will be correct</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Seek Professional Advice</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            Always consult with a qualified financial advisor, stockbroker, or investment professional 
            before making any investment decisions. Do not rely solely on information from NEPSE.io.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-primary-theme">Affiliation</h2>
          <p className="text-sm text-muted-theme leading-relaxed">
            NEPSE.io is not affiliated with, endorsed by, or connected to Nepal Stock Exchange Limited (NEPSE), 
            the Securities Board of Nepal (SEBON), or any brokerage firm.
          </p>
        </section>
      </div>
    </div>
  );
}
