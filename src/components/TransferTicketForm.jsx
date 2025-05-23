import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { initiateTransfer, acceptTransfer, getPendingTransfers } from '../utils/contract';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import EventCoreABI from '../abis/EventCore.sol/EventCore.json';

const TransferTicketForm = ({ eventId, onSuccess }) => {
  const { contracts, account } = useWeb3();
  const [recipient, setRecipient] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('0');
  const [totalPrice, setTotalPrice] = useState('0');
  const [isRecipient, setIsRecipient] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);

  // Add polling interval state
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    const fetchTicketPrice = async () => {
      try {
        const eventContractAddress = await contracts.eventFactory.getEventContract(eventId);
        const eventCore = new ethers.Contract(eventContractAddress, EventCoreABI.abi, contracts.signer);
        const [, , , price] = await eventCore.getEventDetails();
        setTicketPrice(ethers.formatEther(price));
      } catch (error) {
        console.error('Error fetching ticket price:', error);
        toast.error('Failed to fetch ticket price');
      }
    };

    if (contracts && eventId) {
      fetchTicketPrice();
    }
  }, [contracts, eventId]);

  // Separate effect for loading pending transfers
  const loadPendingTransfers = async () => {
    if (!contracts || !account) return;
    try {
      const transfers = await getPendingTransfers(contracts, account);
      setPendingTransfers(transfers);
      
      // If there are pending transfers and we're not in recipient view, switch to it
      if (transfers.length > 0 && !isRecipient) {
        setIsRecipient(true);
        toast.success('You have pending transfers!');
      }
    } catch (error) {
      console.error('Error loading pending transfers:', error);
      toast.error('Failed to load pending transfers');
    }
  };

  // Effect for setting up polling
  useEffect(() => {
    // Load immediately
    loadPendingTransfers();
    
    // Set up polling every 3 seconds
    const interval = setInterval(loadPendingTransfers, 3000);
    setPollingInterval(interval);

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [contracts, account]); // Remove isRecipient from dependencies

  useEffect(() => {
    const total = Number(ticketPrice) * quantity;
    setTotalPrice(total.toFixed(4));
  }, [ticketPrice, quantity]);

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!recipient) {
      toast.error('Please enter the recipient address');
      return;
    }

    if (recipient.toLowerCase() === account.toLowerCase()) {
      toast.error('Cannot transfer tickets to yourself');
      return;
    }

    try {
      setLoading(true);
      await initiateTransfer(contracts, eventId, recipient, quantity);
      toast.success('Transfer initiated! The recipient will need to accept and pay for the tickets.');
      setRecipient('');
      setQuantity(1);
      onSuccess?.();
    } catch (error) {
      console.error('Error initiating transfer:', error);
      toast.error(error.message || 'Failed to initiate transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (from, eventId, quantity) => {
    try {
      setLoading(true);
      const totalAmount = Number(ticketPrice) * quantity;
      await acceptTransfer(contracts, from, eventId, totalAmount);
      toast.success('Transfer accepted and payment completed!');
      // Refresh pending transfers
      const transfers = await getPendingTransfers(contracts, account);
      setPendingTransfers(transfers);
      onSuccess?.();
    } catch (error) {
      console.error('Error accepting transfer:', error);
      toast.error(error.message || 'Failed to accept transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isRecipient ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast('Feature under development.');
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Tickets
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

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Price per ticket: {ticketPrice} ETH</p>
            <p className="text-sm font-medium text-gray-900">Total amount to be paid by recipient: {totalPrice} ETH</p>
          </div>

          <button
            type="submit"
            disabled={loading || !recipient}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Initiating Transfer...
              </div>
            ) : (
              'Initiate Transfer'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Transfers</h3>
          {pendingTransfers.length > 0 ? (
            <div className="space-y-4">
              {pendingTransfers.map((transfer, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-900">{transfer.eventName}</p>
                  <p className="text-sm text-gray-600">From: {transfer.from}</p>
                  <p className="text-sm text-gray-600">Quantity: {transfer.quantity}</p>
                  <p className="text-sm text-gray-600">Price per ticket: {transfer.price} ETH</p>
                  <p className="text-sm font-medium text-gray-900">
                    Total Amount: {(Number(transfer.price) * Number(transfer.quantity)).toFixed(4)} ETH
                  </p>
                  <button
                    onClick={() => handleAcceptTransfer(transfer.from, transfer.eventId, transfer.quantity)}
                    disabled={loading}
                    className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Accepting...' : 'Accept & Pay'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No pending transfers</p>
          )}
        </div>
      )}

      <button
        onClick={() => setIsRecipient(!isRecipient)}
        className="w-full px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700"
      >
        {isRecipient ? 'Switch to Sender View' : 'Switch to Recipient View'}
      </button>
    </div>
  );
};

export default TransferTicketForm;
