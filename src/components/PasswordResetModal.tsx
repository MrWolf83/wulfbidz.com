import { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FieldLabel } from './ui/FieldLabel';

interface PasswordResetModalProps {
  onClose: () => void;
  onBackToSignIn: () => void;
}

type ResetStep = 'request' | 'sent';

export function PasswordResetModal({ onClose, onBackToSignIn }: PasswordResetModalProps) {
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    if (resetError) {
      setError(resetError.message);
      setIsSubmitting(false);
      return;
    }

    setStep('sent');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <KeyRound className="text-red-600" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {step === 'request' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="text-blue-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm text-blue-900">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel required>Email Address</FieldLabel>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && email) {
                      handleRequestReset();
                    }
                  }}
                />
                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
              </div>

              <button
                onClick={handleRequestReset}
                disabled={!email || isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-4 border-t border-gray-200">
                <button
                  onClick={onBackToSignIn}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Check Your Email</h3>
                <p className="text-sm text-green-800 mb-4">
                  We've sent a password reset link to:
                </p>
                <p className="text-sm font-semibold text-green-900 mb-4">{email}</p>
                <p className="text-sm text-green-800">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <span className="font-semibold">Didn't receive the email?</span>
                  <br />
                  Check your spam folder or try requesting another reset link.
                </p>
              </div>

              <button
                onClick={onBackToSignIn}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
