import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-gray-300">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Last Updated:</strong> {currentDate}
            </p>
          </div>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">1. Introduction</h3>
            <p className="mb-3">
              Welcome to WulfBidz ("Company," "we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our online automobile auction platform and related services (collectively, the "Services").
            </p>
            <p>
              By accessing or using our Services, you agree to this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">2. Information We Collect</h3>

            <h4 className="text-lg font-semibold text-red-500 mb-2">2.1 Information You Provide</h4>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, username, password, and profile information</li>
              <li><strong className="text-white">Identity Verification:</strong> Government-issued ID, driver's license, business registration documents, tax identification numbers</li>
              <li><strong className="text-white">Payment Information:</strong> Credit card details, bank account information, billing address, transaction history</li>
              <li><strong className="text-white">Vehicle Information:</strong> Vehicle details, photos, videos, inspection reports, maintenance records</li>
              <li><strong className="text-white">Communications:</strong> Messages, comments, complaints, customer support inquiries</li>
              <li><strong className="text-white">Two-Factor Authentication:</strong> Phone numbers for SMS verification codes</li>
            </ul>

            <h4 className="text-lg font-semibold text-red-500 mb-2">2.2 Automatically Collected Information</h4>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-white">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong className="text-white">Usage Data:</strong> Pages viewed, features used, search queries, bid history, watchlist activity</li>
              <li><strong className="text-white">Location Data:</strong> General geographic location based on IP address</li>
              <li><strong className="text-white">Cookies and Tracking:</strong> Session data, preferences, analytics information</li>
            </ul>

            <h4 className="text-lg font-semibold text-red-500 mb-2">2.3 Information from Third Parties</h4>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Identity verification services</li>
              <li>Payment processors</li>
              <li>Credit reporting agencies (for fraud prevention)</li>
              <li>Public records and databases</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h3>
            <p className="mb-3">We use your personal information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Provide Services:</strong> Process transactions, manage accounts, facilitate auctions</li>
              <li><strong className="text-white">Verify Identity:</strong> Authenticate users, prevent fraud, comply with legal requirements</li>
              <li><strong className="text-white">Process Payments:</strong> Handle financial transactions, calculate fees, issue refunds</li>
              <li><strong className="text-white">Communications:</strong> Send notifications, updates, promotional materials, customer support responses</li>
              <li><strong className="text-white">Improve Services:</strong> Analyze usage patterns, develop new features, enhance user experience</li>
              <li><strong className="text-white">Legal Compliance:</strong> Comply with laws, respond to legal requests, enforce our terms</li>
              <li><strong className="text-white">Security:</strong> Detect fraud, protect against unauthorized access, maintain platform integrity</li>
              <li><strong className="text-white">Marketing:</strong> Send promotional offers, targeted advertising, market research</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">4. Information Sharing and Disclosure</h3>
            <p className="mb-3">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Other Users:</strong> Buyers and sellers in transactions (name, contact information, transaction details)</li>
              <li><strong className="text-white">Service Providers:</strong> Payment processors, hosting services, analytics providers, customer support tools</li>
              <li><strong className="text-white">Business Partners:</strong> Shipping companies, inspection services, financing partners</li>
              <li><strong className="text-white">Legal Authorities:</strong> Law enforcement, regulatory agencies, courts (when required by law)</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong className="text-white">With Your Consent:</strong> Other parties when you explicitly authorize disclosure</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">5. Your Privacy Rights</h3>
            <p className="mb-3">Depending on your location, you may have certain rights regarding your personal information:</p>

            <h4 className="text-lg font-semibold text-red-500 mb-2">5.1 General Rights</h4>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-white">Access:</strong> Request copies of your personal information</li>
              <li><strong className="text-white">Correction:</strong> Request correction of inaccurate information</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong className="text-white">Portability:</strong> Receive your data in a portable format</li>
              <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications</li>
            </ul>

            <h4 className="text-lg font-semibold text-red-500 mb-2">5.2 California Residents (CCPA/CPRA)</h4>
            <p className="mb-2">California residents have additional rights:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale or sharing of personal information</li>
              <li>Right to correct inaccurate personal information</li>
              <li>Right to limit use of sensitive personal information</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
            <p className="mb-4 text-sm bg-gray-800 border border-gray-700 rounded p-3">
              <strong className="text-white">Notice:</strong> We do not sell personal information in the traditional sense. However, certain data sharing practices may be considered "sales" or "sharing" under California law. You can opt-out by contacting us.
            </p>

            <h4 className="text-lg font-semibold text-red-500 mb-2">5.3 Virginia, Colorado, Connecticut, Utah, and Other State Residents</h4>
            <p className="mb-2">Residents of states with comprehensive privacy laws have rights including:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Right to confirm whether we process your personal data</li>
              <li>Right to access your personal data</li>
              <li>Right to correct inaccuracies in your personal data</li>
              <li>Right to delete your personal data</li>
              <li>Right to obtain a copy of your personal data</li>
              <li>Right to opt-out of targeted advertising and sales</li>
            </ul>

            <h4 className="text-lg font-semibold text-red-500 mb-2">5.4 Nevada Residents</h4>
            <p className="mb-4">
              Nevada residents have the right to opt-out of the sale of certain personal information. We do not currently sell personal information as defined by Nevada law.
            </p>

            <h4 className="text-lg font-semibold text-red-500 mb-2">5.5 Exercising Your Rights</h4>
            <p>
              To exercise any of these rights, please contact us at privacy@wulfbidz.com. We will respond to verified requests within the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">6. Data Retention</h3>
            <p className="mb-3">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide our Services and fulfill transactions</li>
              <li>Comply with legal obligations (tax records, transaction history)</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Prevent fraud and maintain security</li>
            </ul>
            <p className="mt-3">
              Generally, we retain transaction records for 7 years, account information for the duration of your account plus 3 years, and communications for 2 years, unless longer retention is required by law.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">7. Data Security</h3>
            <p className="mb-3">
              We implement reasonable security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Employee training on data protection</li>
              <li>Third-party security assessments</li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the Internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">8. Cookies and Tracking Technologies</h3>
            <p className="mb-3">
              We use cookies, web beacons, and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Maintain user sessions and preferences</li>
              <li>Analyze usage patterns and improve our Services</li>
              <li>Provide personalized content and advertising</li>
              <li>Detect and prevent fraud</li>
            </ul>
            <p className="mb-3">
              You can control cookies through your browser settings. However, disabling cookies may limit functionality.
            </p>
            <p>
              We may use third-party analytics services (e.g., Google Analytics) that use cookies to collect usage data. These services have their own privacy policies.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">9. Third-Party Links</h3>
            <p>
              Our Services may contain links to third-party websites, services, or applications. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">10. Children's Privacy</h3>
            <p>
              Our Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">11. International Data Transfers</h3>
            <p className="mb-3">
              Your information may be transferred to, stored, and processed in countries other than your country of residence. These countries may have different data protection laws.
            </p>
            <p>
              By using our Services, you consent to the transfer of your information to the United States and other countries where we operate. We take appropriate safeguards to ensure your information receives adequate protection.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">12. Do Not Track Signals</h3>
            <p>
              Some browsers have "Do Not Track" features. We do not currently respond to Do Not Track signals. We may track user activity across our Services for analytics and improvement purposes as described in this Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">13. Changes to This Privacy Policy</h3>
            <p className="mb-3">
              We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the updated policy on our website</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending email notifications (for significant changes)</li>
            </ul>
            <p className="mt-3">
              Your continued use of our Services after changes become effective constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">14. Contact Information</h3>
            <p className="mb-3">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
              <p><strong className="text-white">Email:</strong> privacy@wulfbidz.com</p>
              <p><strong className="text-white">Mail:</strong> WulfBidz Privacy Officer<br />
              [Company Address]<br />
              [City, State ZIP Code]</p>
              <p><strong className="text-white">Phone:</strong> [Contact Number]</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">15. Dispute Resolution</h3>
            <p className="mb-3">
              Any disputes arising from this Privacy Policy shall be resolved through:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Informal negotiation</li>
              <li>Binding arbitration (if required)</li>
              <li>In accordance with the dispute resolution provisions in our Terms of Service</li>
            </ul>
          </section>

          <section className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-3">16. Consent and Acknowledgment</h3>
            <p>
              By using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. You consent to our collection, use, and disclosure of your personal information as described herein.
            </p>
          </section>

          <div className="border-t border-gray-700 pt-6">
            <p className="text-sm text-gray-400 text-center">
              This Privacy Policy is effective as of the date listed above and applies to all users of WulfBidz Services.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Close Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
}
