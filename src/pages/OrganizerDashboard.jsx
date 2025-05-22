import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { createEvent } from '../utils/contract';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import EventCoreAbi from '../abis/contracts/EventCore.sol/EventCore.json';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

const OrganizerDashboard = () => {
  const { account, contracts } = useWeb3();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    price: '',
    totalTickets: '',
    category: '',
    location: '',
    imageUrl: ''
  });

  const checkContractInitialization = () => {
    console.log('Checking contract initialization in OrganizerDashboard:', {
      contractsExists: !!contracts,
      eventFactoryExists: !!contracts?.eventFactory,
      eventFactoryTarget: contracts?.eventFactory?.target,
      signerExists: !!contracts?.signer,
      account: account,
      networkFromContracts: contracts?.signer?.provider?.network,
    });

    if (!contracts) {
      setError('Contracts not initialized. Please connect your wallet.');
      return false;
    }
    if (!contracts.eventFactory?.target) {
      console.error('EventFactory contract target (address) is undefined. Current contracts object:', contracts);
      setError('Event Factory contract not found. Please ensure you are connected to the correct network (Hardhat local network) and contract is deployed.');
      return false;
    }
    if (!contracts.signer) {
      setError('Wallet not connected. Please connect your wallet.');
      return false;
    }
    if (!account) {
      setError('No account found. Please connect your wallet.');
      return false;
    }
    return true;
  };

  const loadEvents = async () => {
    if (!checkContractInitialization()) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const eventFactory = contracts.eventFactory;
      if (!eventFactory || !eventFactory.target) {
        setError('EventFactory not available from context for loading events.');
        setLoading(false);
        return;
      }

      const nextEventIdBigInt = await eventFactory.nextEventId();
      const nextEventId = Number(nextEventIdBigInt);
      const eventsList = [];

      for (let i = 0; i < nextEventId; i++) {
        try {
          const eventAddress = await eventFactory.getEventContract(i);
          if (!eventAddress || eventAddress === ethers.ZeroAddress) {
            console.log(`Event ID ${i} has no contract or zero address.`);
            continue;
          }

          const eventContract = new ethers.Contract(
            eventAddress,
            EventCoreAbi.abi,
            contracts.signer
          );
          
          if (!eventContract.target) {
            console.warn(`Failed to instantiate EventCore contract for address: ${eventAddress}`);
            continue;
          }

          const details = await eventContract.getEventDetails();
          
          if (!details || typeof details._organizer === 'undefined') {
            console.warn(`Incomplete event details for event ID ${i} at address ${eventAddress}`);
            continue;
          }

          if (details._organizer.toLowerCase() === account.toLowerCase()) {
            const eventDateTimestamp = Number(details._date);
            const totalTicketsNum = Number(details._ticketCount);
            const ticketsRemainNum = Number(details._ticketRemain);
            const ticketsSoldNum = totalTicketsNum - ticketsRemainNum;

            eventsList.push({
              id: i,
              name: details._name,
              description: details._description || 'No description provided.',
              date: new Date(eventDateTimestamp * 1000).toLocaleString(),
              price: ethers.formatEther(details._price),
              totalTickets: totalTicketsNum.toString(),
              ticketsSold: ticketsSoldNum.toString(),
              ticketRemain: ticketsRemainNum.toString(),
              organizer: details._organizer,
              isActive: eventDateTimestamp > Math.floor(Date.now() / 1000),
              category: details._category || 'Other',
              location: details._location || 'Not specified',
              imageUrl: details._imageUrl || ''
            });
          }
        } catch (err) {
          const eventAddressForError = await eventFactory.getEventContract(i).catch(() => "unknown_address");
          console.warn(`Error loading details for event ID ${i} at address ${eventAddressForError}:`, err);
          continue;
        }
      }

      setEvents(eventsList);
    } catch (error) {
      console.error('Error in loadEvents function:', error);
      setError('Failed to load events. Please try again.');
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!checkContractInitialization()) {
      return;
    }

    const eventDate = new Date(formData.date);
    if (eventDate <= new Date()) {
      toast.error('Event date must be in the future');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (parseInt(formData.totalTickets) <= 0) {
      toast.error('Total tickets must be greater than 0');
      return;
    }

    if (!formData.name) {
      toast.error('Please enter event name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await createEvent(contracts, {
        name: formData.name,
        date: formData.date,
        price: formData.price.toString(),
        totalTickets: formData.totalTickets.toString()
      });
      
      toast.success('Event created successfully!');
      
      setFormData({
        name: '',
        description: '',
        date: '',
        price: '',
        totalTickets: '',
        category: '',
        location: '',
        imageUrl: ''
      });
      
      await loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      let errorMessage = 'Failed to create event';
      
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to create event';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contracts) {
      loadEvents();
    }
  }, [contracts, account]);

  // Display loading message while data is being fetched
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Display a message if user is not connected with a wallet
  if (!account) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Please connect your wallet</h2>
          <p className="text-gray-600">Connect your wallet to create and manage events</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadEvents}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Event creation form section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event name input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter event name"
                />
              </div>
              {/* Event date input */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              {/* Ticket price input */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Price (ETH)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
              {/* Total tickets input */}
              <div>
                <label htmlFor="totalTickets" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Tickets
                </label>
                <input
                  type="number"
                  id="totalTickets"
                  name="totalTickets"
                  value={formData.totalTickets}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter total tickets"
                />
              </div>
              {/* Event category selection */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select a category</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="arts">Arts</option>
                  <option value="technology">Technology</option>
                  <option value="food">Food & Drink</option>
                </select>
              </div>
              {/* Event location input */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter event location"
                />
              </div>
            </div>
            {/* Event description textarea */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter event description"
              />
            </div>
            {/* Event image URL input */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter image URL (optional)"
              />
            </div>
            {/* Form submission button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Create Event
            </button>
          </form>
        </div>

        {/* Events list section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Map through organizer's events and render event cards */}
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Event image (if available) */}
                {event.imageUrl && (
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                {/* Event details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    {/* Event information display */}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Date:</span> {event.date}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Price:</span> {event.price} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Total Tickets:</span> {event.totalTickets}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Tickets Sold:</span> {event.ticketsSold}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Tickets Remaining:</span> {event.ticketRemain}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Location:</span> {event.location}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Category:</span> {event.category}
                    </p>
                    {/* Event status indicator (active/ended) */}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {event.isActive ? 'Active' : 'Ended'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OrganizerDashboard;
