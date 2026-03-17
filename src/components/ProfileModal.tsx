import { useState, useEffect } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Shield, Mail, Lock } from 'lucide-react';
import { FieldLabel } from './ui/FieldLabel';
import { US_STATES } from '../data/constants';
import { supabase } from '../lib/supabase';
import { PasswordResetModal } from './PasswordResetModal';

interface ProfileModalProps {
  onClose: () => void;
  initialMode?: 'reset-password';
}

type AuthMode = 'signin' | 'signup' | 'reset' | 'reset-password';

export function ProfileModal({ onClose, initialMode }: ProfileModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode || 'signin');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [returningUser, setReturningUser] = useState<{ email: string; username: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    city: '',
    state: '',
  });

  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [idFront, setIdFront] = useState<string>('');
  const [idBack, setIdBack] = useState<string>('');

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setMode('signin');
    } else {
      const savedEmail = localStorage.getItem('revbid_last_email');
      const savedUsername = localStorage.getItem('revbid_last_username');
      if (savedEmail && savedUsername) {
        setReturningUser({ email: savedEmail, username: savedUsername });
      }
    }
    setCheckingSession(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'idFront' | 'idBack') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'profile') setProfilePhoto(result);
      else if (type === 'idFront') setIdFront(result);
      else setIdBack(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSignIn = async () => {
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        alert('Incorrect email or password. If you forgot your password, click "Forgot your password?" below.');
      } else if (error.message.includes('Email not confirmed')) {
        alert('Please verify your email address before signing in. Check your inbox (and spam folder) for the verification link.');
      } else {
        alert('Failed to sign in: ' + error.message);
      }
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem('revbid_last_email', formData.email);
    setIsSubmitting(false);
    onClose();
  };

  const handleQuickSignIn = async () => {
    if (!returningUser) return;

    setFormData(prev => ({ ...prev, email: returningUser.email }));
    setMode('signin');
    setReturningUser(null);
  };

  const canProceedToStep2 = () => {
    return (
      formData.fullName &&
      formData.username &&
      formData.email &&
      formData.password &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  };

  const canProceedToStep3 = () => {
    return true;
  };

  const canCompleteSignup = () => {
    return true;
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (authError || !authData.user) {
      alert('Failed to create account: ' + (authError?.message || 'Unknown error'));
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username: formData.username,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      city: formData.city,
      state: formData.state,
      photo_url: profilePhoto,
      id_front_url: idFront,
      id_back_url: idBack,
      id_verified: false,
    });

    if (profileError) {
      alert('Failed to create profile: ' + profileError.message);
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem('revbid_last_email', formData.email);
    localStorage.setItem('revbid_last_username', formData.username);

    if (authData.user && !authData.user.email_confirmed_at) {
      alert('Account created successfully! Please check your email inbox (and spam folder) for a verification link. You must verify your email before you can place bids.');
    } else {
      alert('Account created successfully!');
    }

    setIsSubmitting(false);
    onClose();
  };

  if (checkingSession) {
    return null;
  }

  if (mode === 'reset' || mode === 'reset-password') {
    return (
      <PasswordResetModal
        onClose={onClose}
        onBackToSignIn={() => setMode('signin')}
        initialStep={mode === 'reset-password' ? 'update' : 'request'}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
        {returningUser && mode === 'signup' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {returningUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">Welcome back, {returningUser.username}!</p>
                  <p className="text-white/90 text-sm">{returningUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleQuickSignIn}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-lg"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' ? 'Welcome Back' : 'Create Your Profile'}
            </h2>
            {mode === 'signup' && <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {mode === 'signup' && (
          <div className="flex mb-6 px-6 pt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s === step
                      ? 'bg-red-500 text-white'
                      : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      s < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-6">
          {mode === 'signin' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <Mail className="text-blue-600 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Email Verification Required</h4>
                    <p className="text-sm text-blue-800">
                      After signing in, please check your email to verify your account if you haven't already.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel required>Email</FieldLabel>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <FieldLabel required>Password</FieldLabel>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && formData.email && formData.password) {
                      handleSignIn();
                    }
                  }}
                />
              </div>

              <button
                onClick={handleSignIn}
                disabled={!formData.email || !formData.password || isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setMode('reset')}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setStep(1);
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FieldLabel required>Full Name</FieldLabel>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <FieldLabel required>Username</FieldLabel>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateField('username', e.target.value.toLowerCase())}
                        placeholder="johndoe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FieldLabel>Phone</FieldLabel>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <FieldLabel required>Password</FieldLabel>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <FieldLabel required>Confirm Password</FieldLabel>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => setMode('signin')}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>

                  <div className="flex flex-col items-center mb-6">
                    {profilePhoto ? (
                      <div className="relative">
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-red-200"
                        />
                        <button
                          onClick={() => setProfilePhoto('')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'profile')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <FieldLabel>Bio</FieldLabel>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="Your city"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <FieldLabel>State</FieldLabel>
                      <select
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <Shield className="text-blue-600 flex-shrink-0" size={24} />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">Optional: ID Verification</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          Uploading your driver's license helps build trust in our marketplace and may be required for certain high-value transactions.
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Your ID photos are encrypted and stored securely</li>
                          <li>• Only verified staff can access verification documents</li>
                          <li>• You can skip this step and add it later in your profile settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Driver's License Photos (Optional)
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Front of License</FieldLabel>
                      {idFront ? (
                        <div className="relative">
                          <img
                            src={idFront}
                            alt="ID Front"
                            className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                          />
                          <button
                            onClick={() => setIdFront('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Upload size={32} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload Front (Optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'idFront')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <FieldLabel>Back of License</FieldLabel>
                      {idBack ? (
                        <div className="relative">
                          <img
                            src={idBack}
                            alt="ID Back"
                            className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                          />
                          <button
                            onClick={() => setIdBack('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Upload size={32} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload Back (Optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'idBack')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {mode === 'signup' && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 1 && !canProceedToStep2()) || (step === 2 && !canProceedToStep3())}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={!canCompleteSignup() || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
