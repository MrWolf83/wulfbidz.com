import { useState } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Shield } from 'lucide-react';
import { FieldLabel } from './ui/FieldLabel';
import { US_STATES } from '../data/constants';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (skipVerification: boolean = false) => {
    setIsSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
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
      id_front_url: skipVerification ? null : idFront,
      id_back_url: skipVerification ? null : idBack,
      id_verified: false,
    });

    if (profileError) {
      alert('Failed to create profile: ' + profileError.message);
      setIsSubmitting(false);
      return;
    }

    alert('Account created successfully!');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Your Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex mb-6 px-6 pt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? 'bg-orange-500 text-white'
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

        <div className="p-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>Username</FieldLabel>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value.toLowerCase())}
                    placeholder="johndoe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>Email</FieldLabel>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>Password</FieldLabel>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>Confirm Password</FieldLabel>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>
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
                      className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
                    />
                    <button
                      onClick={() => setProfilePhoto('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel>State</FieldLabel>
                  <select
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    <h4 className="font-semibold text-blue-900 mb-2">ID Verification</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      To maintain trust and safety in our marketplace, we encourage ID verification.
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Your ID photos are encrypted and stored securely</li>
                      <li>• Only verified staff can access verification documents</li>
                      <li>• You can skip this step and verify later</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Driver's License Photos
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Front of License</FieldLabel>
                  {idFront ? (
                    <div className="relative">
                      <img
                        src={idFront}
                        alt="ID Front"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => setIdFront('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Front</span>
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
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        onClick={() => setIdBack('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Back</span>
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
        </div>

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
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip Verification
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={!idFront || !idBack || isSubmitting}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Setup'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
