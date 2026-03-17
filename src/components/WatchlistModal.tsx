import { X, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CarCard } from './CarCard';
import type { Listing } from '../lib/supabase';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onViewListing: (listing: Listing) => void;
}

interface WatchlistItem {
  id: string;
  listing_id: string;
  created_at: string;
  listings: Listing;
}

export function WatchlistModal({ isOpen, onClose, userId, onViewListing }: WatchlistModalProps) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && userId) {
      loadWatchlist();
    }
  }, [isOpen, userId]);

  const loadWatchlist = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select(`
          id,
          listing_id,
          created_at,
          listings (
            id,
            title,
            year,
            make,
            model,
            trim,
            mileage,
            location_city,
            location_state,
            current_bid,
            buy_now_price,
            auction_end,
            photos,
            video_urls,
            lot_number,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = (data || []).filter(item => item.listings) as WatchlistItem[];
      setWatchlistItems(items);
      setWatchlistIds(new Set(items.map(item => item.listing_id)));
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      if (error) throw error;

      setWatchlistItems(prev => prev.filter(item => item.listing_id !== listingId));
      setWatchlistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Heart className="text-red-600" size={24} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Watchlist</h2>
              <p className="text-sm text-gray-600">
                {watchlistItems.length} {watchlistItems.length === 1 ? 'vehicle' : 'vehicles'} saved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : watchlistItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your watchlist is empty
              </h3>
              <p className="text-gray-600">
                Start favoriting vehicles by clicking the heart icon on any listing
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlistItems.map((item) => (
                <CarCard
                  key={item.id}
                  listing={item.listings}
                  onClick={() => onViewListing(item.listings)}
                  isInWatchlist={watchlistIds.has(item.listing_id)}
                  onToggleWatchlist={(e) => handleToggleWatchlist(e, item.listing_id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
