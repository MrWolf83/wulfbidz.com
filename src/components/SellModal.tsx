import { useState } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Video } from 'lucide-react';
import { FieldLabel } from './ui/FieldLabel';
import { YEARS, MAKES_MODELS, US_STATES, TRANSMISSIONS, CONDITIONS, SPECIALTY_TRIMS, getTrimsForVehicle } from '../data/constants';
import { supabase } from '../lib/supabase';

interface SellModalProps {
  onClose: () => void;
}

export function SellModal({ onClose }: SellModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReservePriceConfirm, setShowReservePriceConfirm] = useState(false);

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
  const [videos, setVideos] = useState<string[]>([]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 6 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => {
          if (prev.length >= 6) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);

      if (video.duration > 30) {
        alert('Video must be 30 seconds or less');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos((prev) => {
          if (prev.length >= 2) return prev;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    };

    video.src = URL.createObjectURL(file);
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedToStep2 = () => {
    return (
      formData.year &&
      formData.make &&
      formData.model &&
      formData.vin &&
      formData.mileage &&
      formData.transmission &&
      formData.condition
    );
  };

  const canProceedToStep3 = () => {
    return formData.description.length >= 50 && photos.length >= 1;
  };

  const formatMileage = (value: string) => {
    const num = value.replace(/,/g, '');
    if (!num || isNaN(Number(num))) return '';
    return Number(num).toLocaleString('en-US');
  };

  const canSubmit = () => {
    return (
      formData.startingBid &&
      formData.city &&
      formData.state &&
      photos.length > 0
    );
  };

  const handlePreSubmit = () => {
    if (!canSubmit()) return;

    if (formData.reservePrice && Number(formData.reservePrice) > 0) {
      setShowReservePriceConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setShowReservePriceConfirm(false);

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
        video_urls: videos,
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
  const availableTrims = formData.make && formData.model ? getTrimsForVehicle(formData.make, formData.model) : [];

  const getRelevantSpecialtyTrims = () => {
    if (!formData.make || !formData.model) return [];

    const makeModelLower = `${formData.make} ${formData.model}`.toLowerCase();

    return SPECIALTY_TRIMS.filter(trim => {
      const trimLower = trim.toLowerCase();

      if (makeModelLower.includes('mustang')) {
        return trimLower.includes('shelby') || trimLower.includes('saleen') ||
               trimLower.includes('roush') || trimLower.includes('boss') ||
               trimLower.includes('mach') || trimLower.includes('cobra') ||
               trimLower.includes('bullitt') || trimLower.includes('california special') ||
               trimLower.includes('king cobra') || trimLower.includes('svo');
      }

      if (makeModelLower.includes('camaro')) {
        return trimLower.includes('yenko camaro') || trimLower.includes('z/28') ||
               trimLower.includes('zl1') || trimLower.includes('1le') ||
               trimLower.includes('copo') || trimLower.includes('rs/ss') ||
               trimLower.includes('ss 396') || trimLower.includes('ss 454');
      }

      if (makeModelLower.includes('corvette')) {
        return trimLower.includes('callaway');
      }

      if (makeModelLower.includes('chevelle')) {
        return trimLower.includes('yenko chevelle') || trimLower.includes('ss 454') ||
               trimLower.includes('ss 396');
      }

      if (makeModelLower.includes('nova')) {
        return trimLower.includes('yenko nova') || trimLower.includes('ss');
      }

      if (makeModelLower.includes('challenger') || makeModelLower.includes('charger')) {
        return trimLower.includes('hellcat') || trimLower.includes('demon') ||
               trimLower.includes('redeye') || trimLower.includes('jailbreak') ||
               trimLower.includes('scat pack') || trimLower.includes('r/t') ||
               trimLower.includes('daytona') || trimLower.includes('super bee') ||
               trimLower.includes('srt');
      }

      if (makeModelLower.includes('gto')) {
        return trimLower.includes('gto judge');
      }

      if (makeModelLower.includes('firebird') || makeModelLower.includes('trans am')) {
        return trimLower.includes('trans am') || trimLower.includes('ws6') ||
               trimLower.includes('ram air');
      }

      if (makeModelLower.includes('oldsmobile') || makeModelLower.includes('442') ||
          makeModelLower.includes('cutlass')) {
        return trimLower.includes('hurst/olds');
      }

      if (makeModelLower.includes('f-150') || makeModelLower.includes('f-250') ||
          makeModelLower.includes('f-350')) {
        return trimLower.includes('raptor') || trimLower.includes('tremor') ||
               trimLower.includes('svt lightning');
      }

      if (formData.make === 'Mercedes-Benz') {
        return trimLower.includes('amg');
      }

      if (formData.make === 'BMW') {
        return trimLower.includes('m sport') || trimLower.includes('m performance');
      }

      if (formData.make === 'Audi') {
        return trimLower.includes('rs') || trimLower === 's-line';
      }

      if (formData.make === 'Volkswagen') {
        return trimLower.includes('r-line');
      }

      if (formData.make === 'Honda' && makeModelLower.includes('civic')) {
        return trimLower.includes('type r');
      }

      if (formData.make === 'Subaru') {
        return trimLower.includes('sti');
      }

      if (formData.make === 'Nissan') {
        return trimLower.includes('nismo');
      }

      if (formData.make === 'Toyota') {
        return trimLower.includes('trd');
      }

      if (formData.make === 'Chevrolet') {
        return trimLower.includes('ss') || trimLower.includes('redline');
      }

      if (formData.make === 'Dodge') {
        return trimLower.includes('srt') || trimLower.includes('r/t');
      }

      if (formData.make === 'Porsche') {
        return trimLower.includes('turbo') || trimLower.includes('gt2') ||
               trimLower.includes('gt3') || trimLower.includes('gt4') ||
               trimLower.includes('spyder') || trimLower.includes('targa') ||
               trimLower.includes('carrera') || trimLower.includes('competition');
      }

      if (trimLower.includes('anniversary') || trimLower.includes('heritage') ||
          trimLower.includes('launch') || trimLower.includes('first edition') ||
          trimLower.includes('founders') || trimLower.includes('limited') ||
          trimLower.includes('special edition') || trimLower.includes('commemorative')) {
        return true;
      }

      return false;
    });
  };

  const relevantSpecialtyTrims = getRelevantSpecialtyTrims();

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
                  <FieldLabel>Trim / Specialty Edition</FieldLabel>
                  <select
                    value={formData.trim}
                    onChange={(e) => updateField('trim', e.target.value)}
                    disabled={!formData.model}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Trim (Optional)</option>
                    {availableTrims.length > 0 && (
                      <optgroup label={`${formData.make} ${formData.model} Trims`}>
                        {availableTrims.map((trim) => (
                          <option key={trim} value={trim}>
                            {trim}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {relevantSpecialtyTrims.length > 0 && (
                      <optgroup label="Performance & Special Editions">
                        {relevantSpecialtyTrims.map((trim) => (
                          <option key={trim} value={trim}>
                            {trim}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Custom">
                      <option value="CUSTOM">Other (Enter Custom)</option>
                    </optgroup>
                  </select>
                  {formData.trim === 'CUSTOM' && (
                    <input
                      type="text"
                      placeholder="Enter custom trim"
                      onChange={(e) => updateField('trim', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mt-2"
                    />
                  )}
                </div>

                <div>
                  <FieldLabel required>VIN</FieldLabel>
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
                    type="text"
                    value={formatMileage(formData.mileage)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      if (rawValue === '' || !isNaN(Number(rawValue))) {
                        updateField('mileage', rawValue);
                      }
                    }}
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
                <p className={`text-xs mb-2 ${formData.description.length >= 50 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {formData.description.length >= 50 ? '✓ ' : ''}Minimum 50 characters ({formData.description.length}/50)
                </p>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={6}
                  placeholder="Describe the vehicle's condition, features, history, and any issues..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                    formData.description.length >= 50 ? 'border-green-500' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <FieldLabel required>Photos</FieldLabel>
                <p className={`text-xs mb-3 ${photos.length >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {photos.length >= 1 ? '✓ ' : ''}Upload 1-6 photos ({photos.length}/6)
                </p>

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
                  {photos.length < 6 && (
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

              <div>
                <FieldLabel>Videos (Optional)</FieldLabel>
                <p className="text-xs text-gray-500 mb-3">Upload up to 2 videos, max 30 seconds each ({videos.length}/2)</p>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  {videos.map((video, index) => (
                    <div key={index} className="relative aspect-square">
                      <video
                        src={video}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                      <button
                        onClick={() => removeVideo(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Video size={12} />
                        Video {index + 1}
                      </div>
                    </div>
                  ))}
                  {videos.length < 2 && (
                    <label className="aspect-square border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Video size={24} className="text-blue-400 mb-1" />
                      <span className="text-xs text-blue-600 font-medium">Add Video</span>
                      <span className="text-xs text-gray-400">Max 30s</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
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
            <div className="flex flex-col items-end gap-1">
              {step === 2 && !canProceedToStep3() && (
                <p className="text-xs text-red-600 font-medium">
                  {formData.description.length < 50 && photos.length < 1
                    ? 'Add description (50+ chars) and at least 1 photo'
                    : formData.description.length < 50
                    ? 'Description must be at least 50 characters'
                    : 'Add at least 1 photo'}
                </p>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 1 && !canProceedToStep2()) || (step === 2 && !canProceedToStep3())}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePreSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
            </button>
          )}
        </div>
      </div>

      {showReservePriceConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Reserve Price
            </h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-3">
                <span className="font-semibold">Important Notice:</span>
              </p>
              <p className="text-sm text-yellow-900 mb-2">
                Your reserve price is set to <span className="font-bold">${Number(formData.reservePrice).toLocaleString()}</span>
              </p>
              <p className="text-sm text-yellow-900">
                Once your listing goes live, you can only <span className="font-semibold">lower</span> the reserve price, not increase it.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Please verify your reserve price:</h4>
              <div className="text-3xl font-bold text-red-600 mb-1">
                ${Number(formData.reservePrice).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">
                The auction will not sell unless bidding reaches this amount
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReservePriceConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
