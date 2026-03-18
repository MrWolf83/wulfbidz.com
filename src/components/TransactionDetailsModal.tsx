import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  final_price: number;
  seller_fee: number;
  payment_method: string;
  seller_email: string;
  seller_phone: string | null;
  buyer_email: string;
  buyer_phone: string | null;
  transaction_completed_at: string;
  listings: {
    year: number;
    make: string;
    model: string;
    title: string;
  };
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({ isOpen, onClose }: TransactionDetailsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('completed_transactions')
        .select(`
          *,
          listings(year, make, model, title)
        `)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('transaction_completed_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">My Transactions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No transactions found</div>
          ) : (
            <div className="space-y-6">
              {transactions.map((transaction) => {
                const isSeller = transaction.seller_id === currentUserId;
                const vehicleTitle = `${transaction.listings.year} ${transaction.listings.make} ${transaction.listings.model}`;
                const otherPartyEmail = isSeller ? transaction.buyer_email : transaction.seller_email;
                const otherPartyPhone = isSeller ? transaction.buyer_phone : transaction.seller_phone;
                const netAmount = isSeller
                  ? transaction.final_price - transaction.seller_fee
                  : transaction.final_price;

                return (
                  <div key={transaction.id} className="border rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{vehicleTitle}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(transaction.transaction_completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          isSeller ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isSeller ? 'Sold' : 'Purchased'}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {transaction.payment_method === 'buy_now' ? 'Buy Now' : 'Auction Win'}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sale Price:</span>
                            <span className="font-semibold">${transaction.final_price.toLocaleString()}</span>
                          </div>
                          {isSeller && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Seller Fee (5%):</span>
                                <span className="font-semibold text-red-600">
                                  -${transaction.seller_fee.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-900 font-semibold">Net Amount:</span>
                                <span className="font-bold text-green-600">
                                  ${netAmount.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                          {!isSeller && (
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-gray-900 font-semibold">Total Amount:</span>
                              <span className="font-bold text-blue-600">
                                ${netAmount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          {isSeller ? 'Buyer' : 'Seller'} Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600 block mb-1">Email:</span>
                            <a
                              href={`mailto:${otherPartyEmail}`}
                              className="text-blue-600 hover:text-blue-800 font-medium break-all"
                            >
                              {otherPartyEmail}
                            </a>
                          </div>
                          {otherPartyPhone && (
                            <div>
                              <span className="text-gray-600 block mb-1">Phone:</span>
                              <a
                                href={`tel:${otherPartyPhone}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {otherPartyPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-900">
                        <strong>Important:</strong> Please contact the {isSeller ? 'buyer' : 'seller'} directly to finalize the transaction and arrange for vehicle {isSeller ? 'pickup or delivery' : 'inspection and payment'}. WulfBidz is not responsible for the completion of the transaction.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}