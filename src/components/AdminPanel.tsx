import { useState, useEffect } from 'react';
import { X, Plus, Users, Car, Zap, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getRandomMockCar, getRandomUsername, generateRandomBidAmount } from '../utils/mockData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mockUsers, setMockUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
      loadMockUsers();
    }
  }, [isOpen]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.is_admin || false);
    }
  };

  const loadMockUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', 'Mock%');

    if (data) {
      setMockUsers(data);
    }
  };

  const createMockListing = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage('❌ You must be logged in');
        setIsLoading(false);
        return;
      }

      const mockCar = getRandomMockCar();
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + Math.floor(Math.random() * 24) + 24);

      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          year: mockCar.year,
          make: mockCar.make,
          model: mockCar.model,
          trim: mockCar.trim,
          mileage: mockCar.mileage,
          vin: mockCar.vin + Math.random().toString(36).substring(7),
          starting_bid: mockCar.starting_bid,
          current_bid: mockCar.starting_bid,
          description: mockCar.description,
          photos: mockCar.photos,
          auction_end: endsAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessage(`✅ Created: ${data.year} ${data.make} ${data.model}`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createMockUser = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const randomEmail = `mock_${Date.now()}@test.com`;
      const randomPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: randomEmail,
        password: randomPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: 'Mock_' + getRandomUsername() + '_' + Math.floor(Math.random() * 1000),
            phone: '555-' + Math.floor(Math.random() * 900 + 100) + '-' + Math.floor(Math.random() * 9000 + 1000),
            address: Math.floor(Math.random() * 9999) + ' Main St',
            city: 'Test City',
            state: 'CA',
            zip: '90' + Math.floor(Math.random() * 900 + 100),
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      setMessage(`✅ Created mock user: ${randomEmail}`);
      await loadMockUsers();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addRandomBids = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .gt('auction_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (!listings || listings.length === 0) {
        setMessage('❌ No active listings found');
        setIsLoading(false);
        return;
      }

      const { data: mockProfiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', 'Mock%');

      if (!mockProfiles || mockProfiles.length === 0) {
        setMessage('❌ No mock users found. Create some first!');
        setIsLoading(false);
        return;
      }

      let bidCount = 0;
      for (const listing of listings) {
        const numBids = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numBids; i++) {
          const randomBidder = mockProfiles[Math.floor(Math.random() * mockProfiles.length)];
          const bidAmount = generateRandomBidAmount(listing.current_bid);

          const { error } = await supabase
            .from('bids')
            .insert({
              listing_id: listing.id,
              bidder_id: randomBidder.id,
              amount: bidAmount,
            });

          if (!error) {
            await supabase
              .from('listings')
              .update({ current_bid: bidAmount })
              .eq('id', listing.id);

            bidCount++;
          }
        }
      }

      setMessage(`✅ Added ${bidCount} random bids`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMockData = async () => {
    if (!confirm('This will delete all mock users and their data. Continue?')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const { data: mockProfiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', 'Mock%');

      if (mockProfiles && mockProfiles.length > 0) {
        const mockUserIds = mockProfiles.map(p => p.id);

        await supabase
          .from('bids')
          .delete()
          .in('bidder_id', mockUserIds);

        await supabase
          .from('listings')
          .delete()
          .in('seller_id', mockUserIds);

        for (const profile of mockProfiles) {
          await supabase.auth.admin.deleteUser(profile.id);
        }
      }

      setMessage('✅ Cleared all mock data');
      await loadMockUsers();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">You do not have administrator privileges to access this panel.</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-amber-500/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-black">Admin Panel</h2>
            <p className="text-sm text-black/70">Quick testing & mock data tools</p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
              <p className="text-white">{message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={createMockListing}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <Car className="w-8 h-8" />
              <div>
                <div className="font-bold">Create Mock Listing</div>
                <div className="text-sm text-blue-200">Add random classic car</div>
              </div>
            </button>

            <button
              onClick={createMockUser}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <Users className="w-8 h-8" />
              <div>
                <div className="font-bold">Create Mock User</div>
                <div className="text-sm text-green-200">Add test bidder account</div>
              </div>
            </button>

            <button
              onClick={addRandomBids}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <Zap className="w-8 h-8" />
              <div>
                <div className="font-bold">Add Random Bids</div>
                <div className="text-sm text-purple-200">Simulate auction activity</div>
              </div>
            </button>

            <button
              onClick={clearMockData}
              disabled={isLoading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-3"
            >
              <Trash2 className="w-8 h-8" />
              <div>
                <div className="font-bold">Clear Mock Data</div>
                <div className="text-sm text-red-200">Delete all test data</div>
              </div>
            </button>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-white">Mock Users ({mockUsers.length})</h3>
            </div>

            {mockUsers.length === 0 ? (
              <p className="text-gray-400 text-sm">No mock users created yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mockUsers.map((user) => (
                  <div key={user.id} className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded">
                    {user.username} ({user.email})
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <h3 className="font-bold text-amber-500 mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Start Guide
            </h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Create mock users for testing bids</li>
              <li>Create mock listings with sample cars</li>
              <li>Add random bids to simulate activity</li>
              <li>Test features without real data entry</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
