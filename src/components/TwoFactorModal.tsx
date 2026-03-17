import { useState, useEffect } from 'react';
import { X, Shield, Key, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TwoFactorModalProps {
  userId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorModal({ userId, onVerified, onCancel }: TwoFactorModalProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    loadPhoneAndSendCode();
  }, [userId]);

  const loadPhoneAndSendCode = async () => {
    const { data: settings } = await supabase
      .from('user_two_factor_settings')
      .select('phone_verification:user_phone_verification(*)')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .maybeSingle();

    if (settings?.phone_verification) {
      setPhoneNumber(settings.phone_verification.phone_number);
      await sendVerificationCode(settings.phone_verification.phone_number);
    }
  };

  const sendVerificationCode = async (phone: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-sms`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phone,
            action: 'send',
          }),
        }
      );

      const result = await response.json();

      if (result.devCode) {
        setDevCode(result.devCode);
      }
    } catch (err) {
      console.error('Failed to send verification code:', err);
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
        throw new Error('Invalid verification code');
      }

      await supabase
        .from('two_factor_login_attempts')
        .insert({
          user_id: userId,
          attempt_type: 'sms',
          success: true,
          ip_address: null,
        });

      onVerified();
    } catch (err: any) {
      setError(err.message);

      await supabase
        .from('two_factor_login_attempts')
        .insert({
          user_id: userId,
          attempt_type: 'sms',
          success: false,
          ip_address: null,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data: settings } = await supabase
        .from('user_two_factor_settings')
        .select('backup_codes')
        .eq('user_id', userId)
        .maybeSingle();

      if (!settings?.backup_codes || !settings.backup_codes.includes(backupCode)) {
        throw new Error('Invalid backup code');
      }

      const updatedCodes = settings.backup_codes.filter(code => code !== backupCode);

      await supabase
        .from('user_two_factor_settings')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      await supabase
        .from('two_factor_login_attempts')
        .insert({
          user_id: userId,
          attempt_type: 'backup_code',
          success: true,
          ip_address: null,
        });

      onVerified();
    } catch (err: any) {
      setError(err.message);

      await supabase
        .from('two_factor_login_attempts')
        .insert({
          user_id: userId,
          attempt_type: 'backup_code',
          success: false,
          ip_address: null,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Two-Factor Verification</h2>
          </div>
          <button
            onClick={onCancel}
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

          {!useBackupCode ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  A verification code has been sent to {maskPhoneNumber(phoneNumber)}
                </p>
              </div>

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
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && verificationCode.length === 6) {
                      verifyCode();
                    }
                  }}
                />
              </div>

              <button
                onClick={verifyCode}
                disabled={verificationCode.length !== 6 || isLoading}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setUseBackupCode(true)}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  Use backup code instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Enter one of your backup codes to access your account
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key size={16} className="inline mr-1" />
                  Backup Code
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter backup code"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && backupCode) {
                      verifyBackupCode();
                    }
                  }}
                />
              </div>

              <button
                onClick={verifyBackupCode}
                disabled={!backupCode || isLoading}
                className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Backup Code'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setUseBackupCode(false)}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  Use SMS code instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
