import { MapPin, Gauge, Video } from 'lucide-react';
import { CountdownBadge } from './ui/CountdownBadge';
import type { Listing } from '../lib/supabase';

interface CarCardProps {
  listing: Listing;
  onClick: () => void;
}

export function CarCard({ listing, onClick }: CarCardProps) {
  const mainPhoto = listing.photos?.[0]?.url || '/1968-shelby-gt500-side.jpg';
  const hasVideos = listing.video_urls && (listing.video_urls as string[]).length > 0;

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
        {hasVideos && (
          <div className="absolute bottom-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Video size={12} />
            Video Tour
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-xl text-gray-900 line-clamp-1">
            {listing.year} {listing.make} {listing.model}
          </h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
            LOT #{listing.lot_number}
          </span>
        </div>
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
            <p className="text-2xl font-bold text-red-600">
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
