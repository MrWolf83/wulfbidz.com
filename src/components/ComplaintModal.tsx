import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  accusedId: string;
  accusedEmail: string;
  complaintType: 'buyer_backed_out' | 'seller_backed_out';
}

export default function ComplaintModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  accusedId,
  accusedEmail,
  complaintType,
}: ComplaintModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to submit a complaint');
        setIsSubmitting(false);
        return;
      }

      if (user.id === accusedId) {
        setError('You cannot submit a complaint against yourself');
        setIsSubmitting(false);
        return;
      }

      const trimmedDescription = description.trim();
      if (trimmedDescription.length < 50) {
        setError('Description must be at least 50 characters');
        setIsSubmitting(false);
        return;
      }

      const { data: existingComplaint } = await supabase
        .from('deal_complaints')
        .select('id')
        .eq('listing_id', listingId)
        .eq('complainant_id', user.id)
        .maybeSingle();

      if (existingComplaint) {
        setError('You have already submitted a complaint for this listing');
        setIsSubmitting(false);
        return;
      }

      const { error: submitError } = await supabase
        .from('deal_complaints')
        .insert({
          listing_id: listingId,
          complainant_id: user.id,
          accused_id: accusedId,
          complaint_type: complaintType,
          description: trimmedDescription,
        });

      if (submitError) {
        if (submitError.message.includes('unique_complaint_per_listing_per_user')) {
          setError('You have already submitted a complaint for this listing');
        } else if (submitError.message.includes('check_complaint_rate_limit')) {
          setError('You have submitted too many complaints recently. Please try again later.');
        } else {
          setError(submitError.message);
        }
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setDescription('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-white">Submit Deal Complaint</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="bg-green-900 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400 font-semibold">
                Your complaint has been submitted successfully and will be reviewed by our team.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Listing:</span> {listingTitle}
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Accused Party:</span> {accusedEmail}
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold text-white">Complaint Type:</span>{' '}
                  {complaintType === 'buyer_backed_out' ? 'Buyer Backed Out' : 'Seller Backed Out'}
                </p>
              </div>

              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  <strong>Important:</strong> Please provide detailed information about what happened.
                  False or frivolous complaints may result in action against your account. All complaints
                  are reviewed by our team and appropriate action will be taken.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Describe what happened <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={50}
                  rows={8}
                  placeholder="Please provide a detailed description of the situation, including dates, communications, and any relevant details that will help us review this complaint..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 50 characters required. Current: {description.length}
                </p>
              </div>

              {error && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || description.length < 50}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
