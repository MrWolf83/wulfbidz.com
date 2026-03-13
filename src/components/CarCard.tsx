import { MapPin, Gauge } from 'lucide-react';
import { CountdownBadge } from './ui/CountdownBadge';
import type { Listing } from '../lib/supabase';

interface CarCardProps {
  listing: Listing;
  onClick: () => void;
}

export function CarCard({ listing, onClick }: CarCardProps) {
  const mainPhoto = listing.photos?.[0]?.url || 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={mainPhoto}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3">
          <CountdownBadge endDate={listing.auction_end} />
        </div>
        {listing.buy_now_price && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Buy Now Available
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1">
          {listing.year} {listing.make} {listing.model}
        </h3>
        {listing.trim && (
          <p className="text-sm text-gray-600 mb-3">{listing.trim}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Gauge size={16} />
            <span>{listing.mileage.toLocaleString()} mi</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>{listing.location_city}, {listing.location_state}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Bid</p>
            <p className="text-2xl font-bold text-orange-600">
              ${listing.current_bid.toLocaleString()}
            </p>
          </div>
          {listing.buy_now_price && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Buy Now</p>
              <p className="text-lg font-semibold text-green-600">
                ${listing.buy_now_price.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
