import { useState, useEffect } from 'react';
import { X, Gauge, MapPin, Calendar, Cog, User, DollarSign, AlertCircle, Hash } from 'lucide-react';
import { PhotoGrid } from './ui/PhotoGrid';
import { CountdownBadge } from './ui/CountdownBadge';
import { ExpandableDescription } from './ui/ExpandableDescription';
import { supabase, type Listing, type Bid } from '../lib/supabase';
import ComplaintModal from './ComplaintModal';

interface ListingModalProps {
  listing: Listing;
  onClose: () => void;
  onShowAuth?: () => void;
}

export function ListingModal({ listing, onClose, onShowAuth }: ListingModalProps) {
  const [bidAmount, setBidAmount] = useState(
    listing.current_bid > 0 ? listing.current_bid + 100 : listing.starting_bid
  );
  const [bids, setBids] = useState<Bid[]>([]);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [sellerEmail, setSellerEmail] = useState<string>('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });

    loadSellerEmail();
    loadBids();

    const channel = supabase
      .channel(`listing-${listing.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `listing_id=eq.${listing.id}`,
        },
        () => {
          loadBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id]);

  const loadSellerEmail = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', listing.seller_id)
      .maybeSingle();

    if (data) {
      setSellerEmail(data.email || 'Unknown');
    }
  };

  const loadBids = async () => {
    const { data } = await supabase
      .from('bids')
      .select(`
        *,
        bidder:profiles(username, photo_url)
      `)
      .eq('listing_id', listing.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setBids(data);
    }
  };

  const handlePlaceBid = async () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
      return;
    }

    if (currentUser.id === listing.seller_id) {
      alert('You cannot bid on your own listing');
      return;
    }

    if (bidAmount <= listing.current_bid) {
      alert('Your bid must be higher than the current bid');
      return;
    }

    setIsPlacingBid(true);

    const { error: bidError } = await supabase.from('bids').insert({
      listing_id: listing.id,
      bidder_id: currentUser.id,
      amount: bidAmount,
    });

    if (bidError) {
      alert('Failed to place bid. Please try again.');
      setIsPlacingBid(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({ current_bid: bidAmount })
      .eq('id', listing.id);

    if (updateError) {
      alert('Failed to update listing. Please try again.');
    } else {
      alert('Bid placed successfully!');
      setBidAmount(bidAmount + 100);
    }

    setIsPlacingBid(false);
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
      return;
    }

    if (currentUser.id === listing.seller_id) {
      alert('You cannot purchase your own listing');
      return;
    }

    if (!listing.buy_now_price) return;

    const confirmed = confirm(
      `Are you sure you want to buy this vehicle for $${listing.buy_now_price.toLocaleString()}?`
    );

    if (confirmed) {
      alert('Buy Now feature will be integrated with payment processing');
    }
  };

  const photos = listing.photos?.map(p => p.url) || [];
  const videos = (listing.video_urls as string[]) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {listing.year} {listing.make} {listing.model}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Hash size={14} className="text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">LOT {listing.lot_number}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <PhotoGrid photos={photos} videos={videos} />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-600">Year:</span>
                    <span className="font-medium">{listing.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-gray-400" />
                    <span className="text-gray-600">Mileage:</span>
                    <span className="font-medium">{listing.mileage.toLocaleString()} mi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cog size={16} className="text-gray-400" />
                    <span className="text-gray-600">Transmission:</span>
                    <span className="font-medium">{listing.transmission}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">
                      {listing.location_city}, {listing.location_state}
                    </span>
                  </div>
                  {listing.vin && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-mono text-xs">{listing.vin}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Condition</h3>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {listing.condition}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <ExpandableDescription text={listing.description} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-50 to-red-50 p-6 rounded-xl border-2 border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Auction Status</h3>
                  <CountdownBadge endDate={listing.auction_end} />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Bid</p>
                    <p className="text-4xl font-bold text-red-600">
                      ${listing.current_bid.toLocaleString()}
                    </p>
                  </div>

                  {currentUser && currentUser.id !== listing.seller_id && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Bid
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <DollarSign
                              size={18}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(Number(e.target.value))}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              step="100"
                              min={listing.current_bid + 100}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handlePlaceBid}
                        disabled={isPlacingBid}
                        className="w-full bg-gradient-to-r from-red-500 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-red-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                      </button>

                      {listing.buy_now_price && (
                        <button
                          onClick={handleBuyNow}
                          className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
                        >
                          Buy Now - ${listing.buy_now_price.toLocaleString()}
                        </button>
                      )}
                    </div>
                  )}

                  {currentUser && currentUser.id === listing.seller_id && (
                    <div className="text-center py-6 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 font-medium text-sm">This is your listing</p>
                      <p className="text-blue-600 text-xs mt-1">You cannot bid on your own vehicle</p>
                    </div>
                  )}

                  {!currentUser && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 text-sm">
                        Create a free account to place bids
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bid History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bids.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No bids yet</p>
                  ) : (
                    bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium text-sm">
                            {bid.bidder?.username || 'Anonymous'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            ${bid.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(bid.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {currentUser && currentUser.id !== listing.seller_id && bids.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowComplaintModal(true)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <AlertCircle size={16} />
                <span>Report an issue with this deal</span>
              </button>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                If the seller backed out or there was an issue with this transaction
              </p>
            </div>
          )}
        </div>
      </div>

      {showComplaintModal && currentUser && (
        <ComplaintModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          listingId={listing.id}
          listingTitle={`${listing.year} ${listing.make} ${listing.model}`}
          accusedId={listing.seller_id}
          accusedEmail={sellerEmail}
          complaintType="seller_backed_out"
        />
      )}

      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Create Your Free Account</h3>
            <p className="text-gray-600 mb-6">
              Sign up now to start bidding on this vehicle and thousands of others. It's quick, free, and takes less than a minute.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                  onShowAuth?.();
                }}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Create Free Account
              </button>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setShowAuthPrompt(false);
                  onShowAuth?.();
                }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
