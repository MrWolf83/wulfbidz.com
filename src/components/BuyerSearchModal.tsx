import { useState, useEffect } from 'react';
import { X, Search, Bell } from 'lucide-react';
import { FieldLabel } from './ui/FieldLabel';
import { CarCard } from './CarCard';
import { YEARS, MAKES_MODELS, US_STATES, TRANSMISSIONS, CONDITIONS, VEHICLE_TYPES } from '../data/constants';
import { supabase, type Listing } from '../lib/supabase';

interface BuyerSearchModalProps {
  onClose: () => void;
  onSelectListing: (listing: Listing) => void;
}

export function BuyerSearchModal({ onClose, onSelectListing }: BuyerSearchModalProps) {
  const [filters, setFilters] = useState({
    keyword: '',
    vehicleType: '',
    make: '',
    model: '',
    yearFrom: '',
    yearTo: '',
    budgetMin: '',
    budgetMax: '',
    maxMileage: '',
    transmission: '',
    condition: '',
    state: '',
  });

  const [results, setResults] = useState<Listing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  useEffect(() => {
    performSearch();
  }, []);

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field === 'make') {
      setFilters((prev) => ({ ...prev, model: '' }));
    }
  };

  const performSearch = async () => {
    setIsSearching(true);

    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(username, photo_url),
        photos(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.make) {
      query = query.eq('make', filters.make);
    }

    if (filters.model) {
      query = query.eq('model', filters.model);
    }

    if (filters.yearFrom) {
      query = query.gte('year', Number(filters.yearFrom));
    }

    if (filters.yearTo) {
      query = query.lte('year', Number(filters.yearTo));
    }

    if (filters.budgetMax) {
      query = query.lte('current_bid', Number(filters.budgetMax));
    }

    if (filters.maxMileage) {
      query = query.lte('mileage', Number(filters.maxMileage));
    }

    if (filters.transmission) {
      query = query.eq('transmission', filters.transmission);
    }

    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }

    if (filters.state) {
      query = query.eq('location_state', filters.state);
    }

    if (filters.keyword) {
      query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`);
    }

    const { data } = await query;

    setResults(data || []);
    setIsSearching(false);
  };

  const handleSaveAlert = async () => {
    if (!alertName) {
      alert('Please enter a name for this search alert');
      return;
    }

    setIsSavingAlert(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to save search alerts');
      setIsSavingAlert(false);
      return;
    }

    const { error } = await supabase.from('search_alerts').insert({
      user_id: user.id,
      name: alertName,
      filters: filters,
      email_notifications: true,
    });

    if (error) {
      alert('Failed to save search alert');
    } else {
      alert('Search alert saved! You will receive email notifications for matching listings.');
      setAlertName('');
    }

    setIsSavingAlert(false);
  };

  const availableModels = filters.make ? MAKES_MODELS[filters.make] || [] : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-7xl w-full my-8 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Vehicle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid lg:grid-cols-[320px,1fr] gap-6 p-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Search Filters</h3>

            <div>
              <FieldLabel>Keyword Search</FieldLabel>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => updateFilter('keyword', e.target.value)}
                  placeholder="Search vehicles..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Vehicle Type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFilter('vehicleType', filters.vehicleType === type ? '' : type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.vehicleType === type
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Make</FieldLabel>
                <select
                  value={filters.make}
                  onChange={(e) => updateFilter('make', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="">Any Make</option>
                  {Object.keys(MAKES_MODELS).map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Model</FieldLabel>
                <select
                  value={filters.model}
                  onChange={(e) => updateFilter('model', e.target.value)}
                  disabled={!filters.make}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                >
                  <option value="">Any Model</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Year From</FieldLabel>
                <select
                  value={filters.yearFrom}
                  onChange={(e) => updateFilter('yearFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="">Any</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Year To</FieldLabel>
                <select
                  value={filters.yearTo}
                  onChange={(e) => updateFilter('yearTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                  <option value="">Any</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Min Budget</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.budgetMin}
                    onChange={(e) => updateFilter('budgetMin', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Max Budget</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={filters.budgetMax}
                    onChange={(e) => updateFilter('budgetMax', e.target.value)}
                    placeholder="Any"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Max Mileage</FieldLabel>
              <input
                type="number"
                value={filters.maxMileage}
                onChange={(e) => updateFilter('maxMileage', e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <FieldLabel>Transmission</FieldLabel>
              <select
                value={filters.transmission}
                onChange={(e) => updateFilter('transmission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              >
                <option value="">Any</option>
                {TRANSMISSIONS.map((trans) => (
                  <option key={trans} value={trans}>
                    {trans}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Condition</FieldLabel>
              <select
                value={filters.condition}
                onChange={(e) => updateFilter('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              >
                <option value="">Any</option>
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Seller Location</FieldLabel>
              <select
                value={filters.state}
                onChange={(e) => updateFilter('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              >
                <option value="">Any State</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={performSearch}
              disabled={isSearching}
              className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-red-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search Vehicles'}
            </button>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bell size={18} />
                Save Search Alert
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Get email notifications when new listings match your criteria
              </p>
              <input
                type="text"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="Name this search (e.g., Red Mustangs)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm mb-2"
              />
              <button
                onClick={handleSaveAlert}
                disabled={isSavingAlert}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAlert ? 'Saving...' : 'Save Alert'}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">
                {results.length} {results.length === 1 ? 'Result' : 'Results'}
              </h3>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No vehicles match your search criteria</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((listing) => (
                  <CarCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => onSelectListing(listing)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
