import { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import { supabase, type Listing } from '../lib/supabase';

interface CancelListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onCancel: () => void;
}

export default function CancelListingModal({
  isOpen,
  onClose,
  listing,
  onCancel,
}: CancelListingModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const auctionEndDate = new Date(listing.auction_end);
  const now = new Date();
  const hoursUntilEnd = (auctionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const requiresReason = hoursUntilEnd <= 24;

  const handleCancel = async () => {
    if (requiresReason && !reason.trim()) {
      setError('Please provide a reason for cancelling within 24 hours of auction end');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updateData: any = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      };

      if (reason.trim()) {
        updateData.cancellation_reason = reason.trim();
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      if (updateError) throw updateError;

      onCancel();
    } catch (err) {
      console.error('Error cancelling listing:', err);
      setError('Failed to cancel listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-gray-900 rounded-lg max-w-md w-full">
        <div className="border-b border-gray-800 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <XCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Cancel Listing</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-white font-semibold text-lg mb-2">
              {listing.year} {listing.make} {listing.model}
            </h3>
            <p className="text-gray-400 text-sm">
              Current Bid: ${listing.current_bid.toLocaleString()}
            </p>
          </div>

          {requiresReason && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-orange-200 font-semibold mb-1">
                  Reason Required
                </p>
                <p className="text-orange-300/80">
                  This auction ends in less than 24 hours. You must provide a reason for cancelling.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {requiresReason ? 'Cancellation Reason *' : 'Cancellation Reason (Optional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're cancelling this listing..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none min-h-[120px] resize-none"
                required={requiresReason}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Important Notice
              </h4>
              <ul className="text-sm text-gray-400 space-y-1 ml-6 list-disc">
                <li>This action cannot be undone</li>
                <li>All active bids will be cancelled</li>
                <li>Bidders will be notified of the cancellation</li>
                {requiresReason && (
                  <li className="text-orange-400">Late cancellations may affect your seller rating</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Keep Listing
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Cancelling...' : 'Cancel Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
