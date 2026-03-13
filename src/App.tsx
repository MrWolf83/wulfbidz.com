import { useState, useEffect } from 'react';
import { Plus, Search, User, LogOut, Menu, X } from 'lucide-react';
import { supabase, type Listing } from './lib/supabase';
import { CarCard } from './components/CarCard';
import { ListingModal } from './components/ListingModal';
import { SellModal } from './components/SellModal';
import { ProfileModal } from './components/ProfileModal';
import { BuyerSearchModal } from './components/BuyerSearchModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'results'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadListings();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser({ id: user.id, email: user.email || '' });
    }
    setIsLoading(false);
  };

  const loadListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(username, photo_url),
        photos(*)
      `)
      .eq('status', 'active')
      .order('auction_end', { ascending: true })
      .limit(12);

    if (data) {
      setListings(data);
    }
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setShowListingModal(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading WulfBidz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wider">WULFBIDZ</h1>
                <p className="text-xs text-orange-500 -mt-1">wulfbidz.com</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setShowSearchModal(false);
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setCurrentPage('results');
                }}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <Search size={18} />
                Buy a Car
              </button>
              {currentUser && (
                <button
                  onClick={() => setShowSellModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Sell Your Car
                </button>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                  >
                    <User size={20} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-3 border-t border-gray-800 pt-4">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setShowSearchModal(false);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-300 hover:text-white py-2 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setCurrentPage('results');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-300 hover:text-white py-2 flex items-center gap-2 transition-colors"
              >
                <Search size={18} />
                Buy a Car
              </button>
              {currentUser && (
                <button
                  onClick={() => {
                    setShowSellModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Sell Your Car
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentPage === 'home' && (
          <>
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Find Your Perfect Vehicle
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Verified auctions with live bidding, transparent pricing, and trusted sellers.
              </p>
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setCurrentPage('results');
                }}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Start Shopping
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-8">Active Auctions</h3>
              {listings.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">No active listings yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <CarCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => handleSelectListing(listing)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showListingModal && selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => {
            setShowListingModal(false);
            setSelectedListing(null);
          }}
        />
      )}

      {showSellModal && (
        <SellModal
          onClose={() => {
            setShowSellModal(false);
            loadListings();
          }}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => {
            setShowProfileModal(false);
            checkAuth();
          }}
        />
      )}

      {showSearchModal && (
        <BuyerSearchModal
          onClose={() => {
            setShowSearchModal(false);
            setCurrentPage('home');
          }}
          onSelectListing={(listing) => {
            handleSelectListing(listing);
            setShowSearchModal(false);
          }}
        />
      )}
    </div>
  );
}
