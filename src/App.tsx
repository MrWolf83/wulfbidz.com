import { useState, useEffect } from 'react';
import { Plus, Search, User, LogOut, Menu, X, Car, Shield, DollarSign, Clock, List, Settings, Bell, Heart } from 'lucide-react';
import { supabase, type Listing } from './lib/supabase';
import { CarCard } from './components/CarCard';
import { ListingModal } from './components/ListingModal';
import { SellModal } from './components/SellModal';
import { ProfileModal } from './components/ProfileModal';
import { BuyerSearchModal } from './components/BuyerSearchModal';
import MyListingsModal from './components/MyListingsModal';
import AdminPanel from './components/AdminPanel';
import { TwoFactorModal } from './components/TwoFactorModal';
import NotificationsModal from './components/NotificationsModal';
import { WatchlistModal } from './components/WatchlistModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidderCounts, setBidderCounts] = useState<Record<string, number>>({});
  const [showListingModal, setShowListingModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMyListingsModal, setShowMyListingsModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'results'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    updateMetaTags();
    checkAuth();
    loadListings();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setShowProfileModal(true);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          const { data: twoFactorSettings } = await supabase
            .from('user_two_factor_settings')
            .select('is_enabled')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (twoFactorSettings?.is_enabled) {
            setPendingUserId(session.user.id);
            setShowTwoFactorModal(true);
            await supabase.auth.signOut();
          } else {
            setCurrentUser({ id: session.user.id, email: session.user.email || '' });
          }
        } else {
          setCurrentUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null);
        }
      })();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUnreadNotificationCount();
      subscribeToNotifications();
      loadWatchlistIds();
    }
  }, [currentUser]);

  const loadUnreadNotificationCount = async () => {
    if (!currentUser) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      setUnreadNotificationCount(count || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser?.id}`,
        },
        () => {
          loadUnreadNotificationCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadWatchlistIds = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('listing_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setWatchlistIds(new Set(data?.map(item => item.listing_id) || []));
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const handleToggleWatchlist = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      setShowProfileModal(true);
      return;
    }

    const isInWatchlist = watchlistIds.has(listingId);

    try {
      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('listing_id', listingId);

        if (error) throw error;

        setWatchlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: currentUser.id,
            listing_id: listingId,
          });

        if (error) throw error;

        setWatchlistIds(prev => new Set([...prev, listingId]));
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const updateMetaTags = () => {
    document.title = 'WulfBidz - Verified Car Auctions & Live Bidding | wulfbidz.com';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'WulfBidz is your trusted online car auction marketplace. Buy and sell verified vehicles with live bidding, transparent pricing, and secure transactions.');
    }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser({ id: user.id, email: user.email || '' });

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.is_admin || false);
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
      loadBidderCounts(data.map(l => l.id));
    }
  };

  const loadBidderCounts = async (listingIds: string[]) => {
    if (listingIds.length === 0) return;

    const { data } = await supabase
      .from('listing_bidder_counts')
      .select('*')
      .in('listing_id', listingIds);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.listing_id] = item.bidder_count;
      });
      setBidderCounts(counts);
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
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
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
              <img src="/image.png" alt="WulfBidz Logo" className="w-16 h-16 object-contain mix-blend-lighten" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-wider">WULFBIDZ</h1>
                <p className="text-xs text-red-500 -mt-1">wulfbidz.com</p>
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
                <>
                  <button
                    onClick={() => setShowMyListingsModal(true)}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <List size={18} />
                    My Listings
                  </button>
                  <button
                    onClick={() => setShowSellModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Sell Your Car
                  </button>
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button
                    onClick={() => setShowWatchlist(true)}
                    className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                    title="Watchlist"
                  >
                    <Heart size={20} />
                    {watchlistIds.size > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {watchlistIds.size > 9 ? '9+' : watchlistIds.size}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-amber-500 hover:text-amber-400"
                      title="Admin Panel"
                    >
                      <Settings size={20} />
                    </button>
                  )}
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
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                <>
                  <button
                    onClick={() => {
                      setShowMyListingsModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-300 hover:text-white py-2 flex items-center gap-2 transition-colors"
                  >
                    <List size={18} />
                    My Listings
                  </button>
                  <button
                    onClick={() => {
                      setShowSellModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Sell Your Car
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Car Background */}
      {currentPage === 'home' && (
        <div className="relative h-[500px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/1967-Ford-Mustang-Eleanor-Exterior-003-Front-ChromeCars.jpg)',
              opacity: 0.75
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/90" />
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center px-4">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                Find Your Perfect Vehicle
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
                Verified auctions with live bidding, transparent pricing, and trusted sellers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setShowSearchModal(true);
                    setCurrentPage('results');
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl hover:shadow-red-500/50 transform hover:scale-105"
                >
                  Buy a Car
                </button>
                <button
                  onClick={() => {
                    if (currentUser) {
                      setShowSellModal(true);
                    } else {
                      setShowProfileModal(true);
                    }
                  }}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-10 py-5 rounded-lg font-bold text-xl transition-all shadow-2xl hover:shadow-gray-500/50 transform hover:scale-105"
                >
                  Sell a Car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentPage === 'home' && (
          <>


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
                      isInWatchlist={watchlistIds.has(listing.id)}
                      onToggleWatchlist={currentUser ? (e) => handleToggleWatchlist(e, listing.id) : undefined}
                      bidderCount={bidderCounts[listing.id] || 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {currentPage === 'home' && (
        <footer className="bg-gray-900 border-t border-gray-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src="/image.png" alt="WulfBidz Logo" className="w-16 h-16 object-contain mix-blend-lighten" />
                  <div>
                    <h3 className="text-xl font-bold text-white">WULFBIDZ</h3>
                    <p className="text-xs text-red-500">wulfbidz.com</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  Your trusted marketplace for buying and selling verified vehicles through live auctions.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Why WulfBidz?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-400 text-sm">
                    <Shield size={16} className="text-red-500 mt-0.5" />
                    <span>Verified sellers only</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-sm">
                    <DollarSign size={16} className="text-red-500 mt-0.5" />
                    <span>Transparent pricing</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-sm">
                    <Clock size={16} className="text-red-500 mt-0.5" />
                    <span>Live bidding in real-time</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-400 text-sm">
                    <Car size={16} className="text-red-500 mt-0.5" />
                    <span>Wide selection of vehicles</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Getting Started</h4>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => {
                        setShowSearchModal(true);
                        setCurrentPage('results');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      Browse Auctions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        if (currentUser) {
                          setShowSellModal(true);
                        } else {
                          setShowProfileModal(true);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      List Your Vehicle
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setShowFees(!showFees);
                      }}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      Seller Fees
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      {currentUser ? 'My Account' : 'Sign Up / Login'}
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">About WulfBidz</h4>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  WulfBidz is a premier online car auction platform connecting verified buyers and sellers.
                  We provide a secure, transparent marketplace where enthusiasts can find their dream vehicles
                  and sellers can reach serious buyers.
                </p>
                <p className="text-gray-400 text-sm">
                  All auctions are monitored for authenticity and compliance with our seller standards.
                </p>
              </div>
            </div>

            {showFees && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
                <h4 className="text-white font-bold text-lg mb-4">Seller Fees</h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-red-500 font-semibold mb-2">Listing Fee</p>
                    <p className="text-gray-400">
                      <span className="font-bold text-white">FREE</span> - No upfront costs to list your vehicle
                    </p>
                  </div>
                  <div>
                    <p className="text-red-500 font-semibold mb-2">Success Fee</p>
                    <p className="text-gray-400">
                      <span className="font-bold text-white">5%</span> of final sale price (capped at $4,500) - Only charged when your vehicle sells
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-gray-400 mb-3">
                      <span className="font-bold text-white">Examples:</span>
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400">If your car sells for <span className="font-semibold text-white">$50,000</span>:</p>
                        <ul className="ml-4 mt-1 space-y-1 text-gray-400">
                          <li>• Success Fee: $2,500 (5%)</li>
                          <li>• <span className="text-green-400 font-semibold">You Receive: $47,500</span></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-gray-400">If your car sells for <span className="font-semibold text-white">$100,000</span>:</p>
                        <ul className="ml-4 mt-1 space-y-1 text-gray-400">
                          <li>• Success Fee: $4,500 (capped)</li>
                          <li>• <span className="text-green-400 font-semibold">You Receive: $95,500</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      No hidden fees. No reserve fees. No relisting fees. You only pay when you sell.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFees(false)}
                  className="mt-4 text-red-500 hover:text-red-400 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            )}

            <div className="border-t border-gray-800 pt-8 text-center">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} WulfBidz. All rights reserved.
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Secure car auctions. Trusted transactions. Your automotive marketplace.
              </p>
            </div>
          </div>
        </footer>
      )}

      {showListingModal && selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => {
            setShowListingModal(false);
            setSelectedListing(null);
          }}
          onShowAuth={() => {
            setShowListingModal(false);
            setShowProfileModal(true);
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
            setIsPasswordRecovery(false);
            checkAuth();
          }}
          initialMode={isPasswordRecovery ? 'reset-password' : undefined}
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

      {showMyListingsModal && (
        <MyListingsModal
          isOpen={showMyListingsModal}
          onClose={() => setShowMyListingsModal(false)}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {showTwoFactorModal && pendingUserId && (
        <TwoFactorModal
          userId={pendingUserId}
          onVerified={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              setCurrentUser({ id: user.id, email: user.email || '' });
            }
            setShowTwoFactorModal(false);
            setPendingUserId(null);
          }}
          onCancel={async () => {
            await supabase.auth.signOut();
            setShowTwoFactorModal(false);
            setPendingUserId(null);
          }}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showWatchlist && (
        <WatchlistModal
          isOpen={showWatchlist}
          onClose={() => {
            setShowWatchlist(false);
            loadWatchlistIds();
          }}
          userId={currentUser?.id || null}
          onViewListing={(listing) => {
            handleSelectListing(listing);
            setShowWatchlist(false);
          }}
        />
      )}
    </div>
  );
}
