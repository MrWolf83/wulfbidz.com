import { useState, useEffect } from 'react';
import { Shield, Phone, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TwoFactorSettingsProps {
  userId: string;
  onClose: () => void;
}

export function TwoFactorSettings({ userId, onClose }: TwoFactorSettingsProps) {
  const [step, setStep] = useState<'main' | 'setup' | 'verify' | 'backup-codes'>('main');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    loadTwoFactorStatus();
  }, [userId]);

  const loadTwoFactorStatus = async () => {
    const { data: settings } = await supabase
      .from('user_two_factor_settings')
      .select('*, phone_verification:user_phone_verification(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (settings) {
      setIsEnabled(settings.is_enabled);
      if (settings.phone_verification) {
        setPhoneNumber(settings.phone_verification.phone_number);
        setIsPhoneVerified(settings.phone_verification.is_verified);
      }
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    setError('');
    setDevCode('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-sms`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            action: 'send',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code');
      }

      // In development, show the code
      if (result.devCode) {
        setDevCode(result.devCode);
      }

      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-sms`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber,
            action: 'verify',
            code: verificationCode,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.verified) {
        throw new Error(result.error || 'Invalid verification code');
      }

      // Generate backup codes
      const { data: codes } = await supabase.rpc('generate_backup_codes');

      if (codes) {
        setBackupCodes(codes);
      }

      // Get the phone verification record
      const { data: phoneVerification } = await supabase
        .from('user_phone_verification')
        .select('id')
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('is_verified', true)
        .maybeSingle();

      // Create or update 2FA settings
      await supabase
        .from('user_two_factor_settings')
        .upsert({
          user_id: userId,
          is_enabled: true,
          phone_verification_id: phoneVerification?.id,
          backup_codes: codes,
        }, {
          onConflict: 'user_id'
        });

      setIsPhoneVerified(true);
      setIsEnabled(true);
      setStep('backup-codes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setIsLoading(true);
    try {
      await supabase
        .from('user_two_factor_settings')
        .update({ is_enabled: false })
        .eq('user_id', userId);

      setIsEnabled(false);
      alert('Two-factor authentication has been disabled.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    alert('Backup codes copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-red-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'main' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What is Two-Factor Authentication?</h3>
                <p className="text-sm text-blue-800">
                  Two-factor authentication adds an extra layer of security to your account by requiring
                  a verification code sent to your phone in addition to your password.
                </p>
              </div>

              {isEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="text-green-600" size={24} />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">2FA is Enabled</p>
                      <p className="text-sm text-green-700">Phone: {phoneNumber}</p>
                    </div>
                  </div>

                  <button
                    onClick={disableTwoFactor}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep('setup')}
                  className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield size={20} />
                  Enable Two-Factor Authentication
                </button>
              )}
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Enter Your Phone Number</h3>
              <p className="text-sm text-gray-600">
                We'll send a verification code to this number.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('main')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendVerificationCode}
                  disabled={!phoneNumber || isLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Enter Verification Code</h3>
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to {phoneNumber}
              </p>

              {devCode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Development Mode</p>
                  <p className="text-sm text-yellow-800">
                    Your verification code is: <span className="font-mono font-bold">{devCode}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key size={16} className="inline mr-1" />
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {step === 'backup-codes' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-600" size={32} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">2FA Enabled Successfully!</h3>
                  <p className="text-sm text-gray-600">Save your backup codes</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Important: Save These Backup Codes</p>
                <p className="text-sm text-yellow-800">
                  Each backup code can be used once to access your account if you lose your phone.
                  Store them in a safe place.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded border border-gray-200">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Copy Codes
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
