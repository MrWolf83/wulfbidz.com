import { useState, useEffect } from 'react';
import { X, Car, AlertCircle } from 'lucide-react';
import { supabase, type Listing } from '../lib/supabase';
import ComplaintModal from './ComplaintModal';

interface MyListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ListingWithBidder extends Listing {
  highest_bidder?: {
    id: string;
    email: string;
    username: string;
  };
}

export default function MyListingsModal({ isOpen, onClose }: MyListingsModalProps) {
  const [myListings, setMyListings] = useState<ListingWithBidder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingWithBidder | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMyListings();
    }
  }, [isOpen]);

  const loadMyListings = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (listingsData) {
      const listingsWithBidders = await Promise.all(
        listingsData.map(async (listing) => {
          const { data: highestBid } = await supabase
            .from('bids')
            .select('bidder_id, amount')
            .eq('listing_id', listing.id)
            .order('amount', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (highestBid) {
            const { data: bidderProfile } = await supabase
              .from('profiles')
              .select('id, email, username')
              .eq('id', highestBid.bidder_id)
              .maybeSingle();

            return {
              ...listing,
              highest_bidder: bidderProfile || undefined,
            };
          }

          return listing;
        })
      );

      setMyListings(listingsWithBidders);
    }

    setIsLoading(false);
  };

  const handleReportBuyer = (listing: ListingWithBidder) => {
    setSelectedListing(listing);
    setShowComplaintModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Car className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">My Listings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your listings...</p>
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">You haven't listed any vehicles yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-2">
                          {listing.year} {listing.make} {listing.model}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Status</p>
                            <p className="text-white font-medium capitalize">{listing.status}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Current Bid</p>
                            <p className="text-green-400 font-semibold">
                              ${listing.current_bid.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Auction End</p>
                            <p className="text-white">
                              {new Date(listing.auction_end).toLocaleDateString()}
                            </p>
                          </div>
                          {listing.highest_bidder && (
                            <div>
                              <p className="text-gray-500">Highest Bidder</p>
                              <p className="text-white font-medium">
                                {listing.highest_bidder.username}
                              </p>
                            </div>
                          )}
                        </div>

                        {listing.highest_bidder && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <button
                              onClick={() => handleReportBuyer(listing)}
                              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                              <AlertCircle size={16} />
                              <span>Report buyer for backing out of deal</span>
                            </button>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                              Only submit if the buyer failed to complete the purchase
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showComplaintModal && selectedListing && selectedListing.highest_bidder && (
        <ComplaintModal
          isOpen={showComplaintModal}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedListing(null);
          }}
          listingId={selectedListing.id}
          listingTitle={`${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`}
          accusedId={selectedListing.highest_bidder.id}
          accusedEmail={selectedListing.highest_bidder.email}
          complaintType="buyer_backed_out"
        />
      )}
    </>
  );
}
