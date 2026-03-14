import { useState } from 'react';
import { X, Upload, ChevronRight, ChevronLeft } from 'lucide-react';
import { FieldLabel } from './ui/FieldLabel';
import { YEARS, MAKES_MODELS, US_STATES, TRANSMISSIONS, CONDITIONS } from '../data/constants';
import { supabase } from '../lib/supabase';

interface SellModalProps {
  onClose: () => void;
}

export function SellModal({ onClose }: SellModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    vin: '',
    mileage: '',
    transmission: 'Automatic',
    condition: 'Good',
    description: '',
    startingBid: '',
    reservePrice: '',
    buyNowPrice: '',
    auctionDays: '7',
    city: '',
    state: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedToStep2 = () => {
    return (
      formData.year &&
      formData.make &&
      formData.model &&
      formData.mileage &&
      formData.transmission &&
      formData.condition
    );
  };

  const canProceedToStep3 = () => {
    return formData.description.length >= 50;
  };

  const canSubmit = () => {
    return (
      formData.startingBid &&
      formData.city &&
      formData.state &&
      photos.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to create a listing');
      setIsSubmitting(false);
      return;
    }

    const auctionEnd = new Date();
    auctionEnd.setDate(auctionEnd.getDate() + Number(formData.auctionDays));

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title: `${formData.year} ${formData.make} ${formData.model}`,
        year: formData.year,
        make: formData.make,
        model: formData.model,
        trim: formData.trim,
        vin: formData.vin,
        mileage: Number(formData.mileage),
        transmission: formData.transmission,
        condition: formData.condition,
        description: formData.description,
        starting_bid: Number(formData.startingBid),
        current_bid: 0,
        reserve_price: formData.reservePrice ? Number(formData.reservePrice) : null,
        buy_now_price: formData.buyNowPrice ? Number(formData.buyNowPrice) : null,
        auction_end: auctionEnd.toISOString(),
        location_city: formData.city,
        location_state: formData.state,
        status: 'active',
      })
      .select()
      .single();

    if (listingError || !listing) {
      alert('Failed to create listing. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const photoInserts = photos.map((url, index) => ({
      listing_id: listing.id,
      url,
      position: index,
    }));

    await supabase.from('photos').insert(photoInserts);

    alert('Listing created successfully!');
    setIsSubmitting(false);
    onClose();
  };

  const availableModels = formData.make ? MAKES_MODELS[formData.make] || [] : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">List Your Vehicle</h2>
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

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Year</FieldLabel>
                  <select
                    value={formData.year}
                    onChange={(e) => updateField('year', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Make</FieldLabel>
                  <select
                    value={formData.make}
                    onChange={(e) => {
                      updateField('make', e.target.value);
                      updateField('model', '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Make</option>
                    {Object.keys(MAKES_MODELS).map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Model</FieldLabel>
                  <select
                    value={formData.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    disabled={!formData.make}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Model</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Trim</FieldLabel>
                  <input
                    type="text"
                    value={formData.trim}
                    onChange={(e) => updateField('trim', e.target.value)}
                    placeholder="e.g., Sport, Limited, LX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel>VIN</FieldLabel>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => updateField('vin', e.target.value.toUpperCase())}
                    placeholder="17-character VIN"
                    maxLength={17}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <FieldLabel required>Mileage</FieldLabel>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => updateField('mileage', e.target.value)}
                    placeholder="Enter mileage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>Transmission</FieldLabel>
                  <select
                    value={formData.transmission}
                    onChange={(e) => updateField('transmission', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {TRANSMISSIONS.map((trans) => (
                      <option key={trans} value={trans}>
                        {trans}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Condition</FieldLabel>
                  <select
                    value={formData.condition}
                    onChange={(e) => updateField('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description & Photos</h3>

              <div>
                <FieldLabel required>Description</FieldLabel>
                <p className="text-xs text-gray-500 mb-2">
                  Minimum 50 characters ({formData.description.length}/50)
                </p>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={6}
                  placeholder="Describe the vehicle's condition, features, history, and any issues..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <FieldLabel>Photos</FieldLabel>
                <p className="text-xs text-gray-500 mb-3">Upload up to 20 photos</p>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 20 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Settings</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Starting Bid</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.startingBid}
                      onChange={(e) => updateField('startingBid', e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>Reserve Price</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.reservePrice}
                      onChange={(e) => updateField('reservePrice', e.target.value)}
                      placeholder="Optional"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum price you'll accept
                  </p>
                </div>

                <div>
                  <FieldLabel>Buy Now Price</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.buyNowPrice}
                      onChange={(e) => updateField('buyNowPrice', e.target.value)}
                      placeholder="Optional"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Instant purchase option
                  </p>
                </div>

                <div>
                  <FieldLabel required>Auction Duration</FieldLabel>
                  <select
                    value={formData.auctionDays}
                    onChange={(e) => updateField('auctionDays', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="10">10 Days</option>
                    <option value="14">14 Days</option>
                  </select>
                </div>

                <div>
                  <FieldLabel required>City</FieldLabel>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Vehicle location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FieldLabel required>State</FieldLabel>
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
              className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
