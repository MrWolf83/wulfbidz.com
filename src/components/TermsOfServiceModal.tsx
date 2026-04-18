import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-zinc-300">
          <p className="text-sm text-zinc-400">
            <strong>Effective Date:</strong> April 18, 2026
          </p>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h3>
            <p>
              By accessing or using WulfBidz ("the Platform"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">2. Eligibility</h3>
            <p className="mb-2">
              You must be at least 18 years old to use WulfBidz. By using the Platform, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into binding contracts</li>
              <li>You are not prohibited by law from using the Platform</li>
              <li>All information you provide is accurate and current</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">3. Account Registration</h3>
            <p className="mb-2">
              To participate in auctions or list vehicles, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">4. Listing Vehicles</h3>
            <p className="mb-2">
              When listing a vehicle for sale, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You have legal ownership or authority to sell the vehicle</li>
              <li>All information provided about the vehicle is accurate and complete</li>
              <li>The vehicle is free from undisclosed liens, encumbrances, or legal issues</li>
              <li>All photos and videos accurately represent the vehicle's current condition</li>
              <li>You will honor the sale if the reserve price is met or Buy Now is used</li>
            </ul>
            <p className="mt-3">
              Sellers are responsible for paying a 5% seller fee (capped at $4,000) on completed transactions.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">5. Bidding and Buying</h3>
            <p className="mb-2">
              When placing a bid or using Buy Now, you agree that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>All bids are legally binding offers to purchase</li>
              <li>You have the financial means to complete the purchase</li>
              <li>Winning a bid creates a binding purchase contract</li>
              <li>You will complete the transaction within the specified timeframe</li>
              <li>You are responsible for inspecting the vehicle before finalizing payment</li>
            </ul>
            <p className="mt-3">
              Buyers are responsible for paying a 5% buyer fee (capped at $4,000) on completed transactions.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">6. Fees and Payment</h3>
            <p className="mb-2">
              WulfBidz charges the following fees:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Seller Fee:</strong> 5% of final sale price (maximum $4,000)</li>
              <li><strong>Buyer Fee:</strong> 5% of final sale price (maximum $4,000)</li>
            </ul>
            <p className="mt-3">
              All fees are non-refundable once a transaction is completed. Buyers and sellers are responsible
              for completing payment and vehicle transfer directly with each other. WulfBidz is not responsible
              for payment processing between parties.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">7. Transaction Completion</h3>
            <p className="mb-2">
              Buyers and sellers must:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Complete all transactions in good faith</li>
              <li>Communicate promptly and professionally</li>
              <li>Arrange for vehicle inspection, payment, and transfer</li>
              <li>Comply with all applicable laws regarding vehicle sales and transfers</li>
              <li>Transfer title and ownership properly according to state/local laws</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">8. Prohibited Conduct</h3>
            <p className="mb-2">
              You may not:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Manipulate bidding or auction outcomes (shill bidding)</li>
              <li>Contact other users to circumvent the Platform</li>
              <li>Use automated systems (bots) to interact with the Platform</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>List vehicles you do not own or have authority to sell</li>
              <li>Retract bids without valid cause</li>
              <li>Refuse to complete a transaction without legitimate reason</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">9. Dispute Resolution</h3>
            <p className="mb-2">
              If a dispute arises between buyer and seller:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Parties should attempt to resolve disputes directly</li>
              <li>Users may file a complaint through the Platform</li>
              <li>WulfBidz may investigate complaints and take appropriate action</li>
              <li>WulfBidz reserves the right to suspend or ban users who violate these Terms</li>
            </ul>
            <p className="mt-3">
              WulfBidz is a marketplace platform and is not a party to transactions between buyers and sellers.
              We are not responsible for resolving disputes or guaranteeing transaction completion.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">10. Disclaimers</h3>
            <p className="mb-2">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WULFBIDZ:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Does not guarantee the accuracy of vehicle listings</li>
              <li>Does not verify the condition or ownership of listed vehicles</li>
              <li>Is not responsible for the actions of buyers or sellers</li>
              <li>Does not guarantee transaction completion</li>
              <li>Is not liable for losses resulting from transactions</li>
              <li>Does not provide warranties regarding Platform availability or performance</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">11. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WULFBIDZ SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Your use or inability to use the Platform</li>
              <li>Any unauthorized access to or use of our servers</li>
              <li>Any bugs, viruses, or other harmful code transmitted through the Platform</li>
              <li>Any errors or omissions in content or listings</li>
              <li>Any conduct of third parties on the Platform</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">12. Indemnification</h3>
            <p>
              You agree to indemnify, defend, and hold harmless WulfBidz and its officers, directors, employees,
              and agents from any claims, liabilities, damages, losses, and expenses arising from your use of
              the Platform, your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">13. Account Suspension and Termination</h3>
            <p className="mb-2">
              WulfBidz reserves the right to suspend or terminate your account at any time for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Complaints from other users</li>
              <li>Non-payment of fees</li>
              <li>Any reason at our sole discretion</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">14. Intellectual Property</h3>
            <p>
              All content on the Platform, including logos, text, graphics, and software, is the property of
              WulfBidz or its licensors and is protected by copyright, trademark, and other intellectual
              property laws. You may not use, copy, or distribute any content without permission.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">15. Modifications to Terms</h3>
            <p>
              WulfBidz reserves the right to modify these Terms at any time. We will notify users of significant
              changes by posting a notice on the Platform. Your continued use of the Platform after changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">16. Governing Law</h3>
            <p>
              These Terms are governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles. Any disputes arising from these Terms or your use
              of the Platform shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">17. Contact Information</h3>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> support@wulfbidz.com
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">18. Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
              will remain in full force and effect.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">19. Entire Agreement</h3>
            <p>
              These Terms constitute the entire agreement between you and WulfBidz regarding your use of the
              Platform and supersede all prior agreements and understandings.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6">
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
