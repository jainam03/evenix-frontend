import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { purchaseTicket } from '../utils/contract';
import toast from 'react-hot-toast';

const BuyTicketForm = ({ eventId, price, onSuccess }) => {
  const { account, contracts } = useWeb3();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const totalPrice = price * quantity;
      await purchaseTicket(contracts, eventId, quantity, totalPrice);
      toast.success('Ticket purchased successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast.error(error.message || 'Failed to purchase ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Price
          </label>
          <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
            <span className="text-lg font-semibold text-gray-900">{(price * quantity).toFixed(4)} ETH</span>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Purchasing...
          </div>
        ) : (
          'Purchase Ticket'
        )}
      </button>
    </form>
  );
};

export default BuyTicketForm;
