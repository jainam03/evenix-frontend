// Import necessary libraries and components
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  getEventDetails, 
  getUserTickets, 
  purchaseTicket, 
  searchEvents,
  getEventsByCategory,
  registerUser
} from '../utils/contract';
import toast from 'react-hot-toast';
import BuyTicketForm from '../components/BuyTicketForm';
import TransferTicketForm from '../components/TransferTicketForm';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import EventCoreABI from '../abis/EventCore.sol/EventCore.json';

const UserDashboard = () => {
    const navigate = useNavigate();
    // Web3 context for blockchain interactions
    const { account, contracts } = useWeb3();
    // State management for the dashboard
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isRegistered, setIsRegistered] = useState(true);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [eventDetails, setEventDetails] = useState({});

    // Fetch events based on search query, category filter, or all events
    const loadEvents = async () => {
        if (!contracts) return;
        
        try {
            let eventsList;
            if (searchQuery) {
                // Search events by name
                eventsList = await searchEvents(contracts, searchQuery);
            } else if (selectedCategory !== 'all') {
                // Filter events by category
                eventsList = await getEventsByCategory(contracts, selectedCategory);
            } else {
                // Load all available events
                const nextEventId = await contracts.eventFactory.nextEventId();
                console.log("nextEventId", nextEventId.toString());
                eventsList = [];
                
                // Loop through all events and get their details
                for (let i = 0; i < nextEventId; i++) {
                    try {
                        const eventAddress = await contracts.eventFactory.getEventContract(i);
                        console.log("Event address for id", i, ":", eventAddress);
                        if (eventAddress !== ethers.ZeroAddress) {
                            // Create contract instance for this specific event
                            const eventCore = new ethers.Contract(eventAddress, EventCoreABI.abi, contracts.signer);
                            try {
                                const [organizer, name, date, price, totalTickets, ticketsRemaining] = await eventCore.getEventDetails();
                                console.log("Event details for id", i, ":", {organizer, name, date, price, totalTickets, ticketsRemaining});
                                // Format event data for the UI
                                eventsList.push({
                                    id: i,
                                    name,
                                    description: '', // Not available in contract
                                    date: new Date(Number(date) * 1000).toLocaleString(),
                                    price: ethers.formatEther(price),
                                    totalTickets: totalTickets.toString(),
                                    ticketsSold: (totalTickets - ticketsRemaining).toString(),
                                    organizer,
                                    isActive: Number(date) > Math.floor(Date.now() / 1000),
                                    category: 'other', // Not available in contract
                                    location: '', // Not available in contract
                                    imageUrl: '' // Not available in contract
                                });
                            } catch (err) {
                                console.error("Error calling getEventDetails for id", i, ":", err);
                            }
                        }
                    } catch (error) {
                        console.error(`Error loading event ${i}:`, error);
                        continue;
                    }
                }
            }
            console.log("Final eventsList:", eventsList);
            setEvents(eventsList);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Failed to load events');
        }
    };

    // Fetch tickets owned by the current user
    const loadTickets = async () => {
        if (!contracts || !account) return;

        try {
            const ticketsList = await getUserTickets(contracts, account);
            setTickets(ticketsList);
        } catch (error) {
            console.error('Error loading tickets:', error);
            toast.error('Failed to load tickets');
        }
    };

    // Handle ticket purchase for an event
    const handlePurchaseTicket = async (eventId, price) => {
        if (!contracts) {
            toast.error('Please connect your wallet first');
            return;
        }

        try {
            await purchaseTicket(contracts, eventId, price);
            toast.success('Ticket purchased successfully!');
            loadEvents();
            loadTickets();
        } catch (error) {
            console.error('Error purchasing ticket:', error);
            if (error.message.includes('insufficient funds')) {
                toast.error('Insufficient funds to purchase ticket');
            } else {
                toast.error('Failed to purchase ticket');
            }
        }
    };

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        loadEvents();
    };

    // Handle category filter change
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setSearchQuery('');
    };

    // Load details for a specific event
    const loadEventDetails = async (eventId) => {
        if (!contracts || !eventId) return;
        try {
            const eventAddress = await contracts.eventFactory.getEventContract(eventId);
            if (eventAddress === ethers.ZeroAddress) return;
            
            // Create contract instance for this specific event
            const eventCore = new ethers.Contract(eventAddress, EventCoreABI.abi, contracts.signer);
            const [organizer, name, date, price, totalTickets, ticketsRemaining] = await eventCore.getEventDetails();
            
            // Store event details in state for UI display
            setEventDetails(prev => ({
                ...prev,
                [eventId]: {
                    name,
                    date: new Date(Number(date) * 1000).toLocaleString(),
                    price: ethers.formatEther(price)
                }
            }));
        } catch (error) {
            console.error(`Error loading event details for ${eventId}:`, error);
        }
    };

    // Check if user is registered when component mounts
    useEffect(() => {
        const checkRegistration = async () => {
            if (!contracts || !account) return;
            try {
                const profile = await contracts.userTicketHub.userProfiles(account);
                setIsRegistered(profile.isRegistered);
            } catch (e) {
                setIsRegistered(false);
            }
        };
        checkRegistration();
    }, [contracts, account]);

    // Load events and tickets when component mounts or dependencies change
    useEffect(() => {
        if (contracts) {
            loadEvents();
            loadTickets();
        }
        setLoading(false);
    }, [contracts, account, selectedCategory]);

    // Load event details for tickets when tickets state changes
    useEffect(() => {
        // Load event details for all unique event IDs in tickets
        const uniqueEventIds = [...new Set(tickets.map(ticket => ticket.eventId))];
        uniqueEventIds.forEach(eventId => {
            if (!eventDetails[eventId]) {
                loadEventDetails(eventId);
            }
        });
    }, [tickets]);

    // Show connection prompt if wallet is not connected
    if (!account) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Please connect your wallet to view events</h2>
                    <p className="text-gray-600">Connect your wallet to browse and purchase tickets</p>
                </div>
            </div>
        );
    }

    // Show registration form if user is not registered
    if (!isRegistered) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!userName) {
                            toast.error('Please enter a username');
                            return;
                        }
                        setRegisterLoading(true);
                        try {
                            // Register user on the blockchain
                            await registerUser(contracts, userName, email);
                            toast.success('Registration successful!');
                            setIsRegistered(true);
                        } catch (err) {
                            toast.error('Registration failed');
                        } finally {
                            setRegisterLoading(false);
                        }
                    }}
                    className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Register to use Event DApp</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={registerLoading}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {registerLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            </div>
        );
    }

    // Show loading spinner while data is being fetched
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                    {/* Search input and button */}
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search events..."
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                    {/* Category filter buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleCategoryChange('music')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'music'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Music
                        </button>
                        <button
                            onClick={() => handleCategoryChange('sports')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'sports'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Sports
                        </button>
                        <button
                            onClick={() => handleCategoryChange('arts')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'arts'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Arts
                        </button>
                        <button
                            onClick={() => handleCategoryChange('technology')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'technology'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Technology
                        </button>
                        <button
                            onClick={() => handleCategoryChange('food')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedCategory === 'food'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Food & Drink
                        </button>
                    </div>
                </form>
            </div>

            {/* Events Section - Displays available events for purchase */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Map through available events and render event cards */}
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
                                        <span className="font-medium">Tickets:</span> {event.ticketsSold}/{event.totalTickets}
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
                                {/* Ticket purchase form component */}
                                <BuyTicketForm
                                    eventId={event.id}
                                    price={event.price}
                                    onSuccess={() => {
                                        loadEvents();
                                        loadTickets();
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tickets Section - Displays user's purchased tickets */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Tickets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Group tickets by event and display summary for each event */}
                    {Object.entries(tickets.reduce((acc, ticket) => {
                        // Create groups of tickets by event ID
                        if (!acc[ticket.eventId]) {
                            acc[ticket.eventId] = {
                                eventId: ticket.eventId,
                                tickets: [],
                                usedCount: 0,
                                validCount: 0,
                                price: ticket.price
                            };
                        }
                        acc[ticket.eventId].tickets.push(ticket);
                        if (ticket.isUsed) {
                            acc[ticket.eventId].usedCount++;
                        } else {
                            acc[ticket.eventId].validCount++;
                        }
                        return acc;
                    }, {})).map(([eventId, group]) => (
                        <div key={eventId} className="bg-white rounded-xl shadow-lg p-6">
                            {/* Event name from loaded details or placeholder */}
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {eventDetails[eventId]?.name || `Event #${eventId}`}
                            </h3>
                            {/* Event date if available */}
                            {eventDetails[eventId]?.date && (
                                <p className="text-sm text-gray-500 mb-4">
                                    {eventDetails[eventId].date}
                                </p>
                            )}
                            <div className="space-y-2 mb-4">
                                {/* Ticket statistics for this event */}
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Total Tickets:</span> {group.tickets.length}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Valid Tickets:</span> {group.validCount}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Used Tickets:</span> {group.usedCount}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Price per Ticket:</span> {group.price} ETH
                                </p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Total Value:</span> {(Number(group.price) * group.tickets.length).toFixed(4)} ETH
                                </p>
                            </div>
                            {/* Ticket transfer form - only shown if user has valid tickets */}
                            {group.validCount > 0 && (
                                <TransferTicketForm
                                    eventId={eventId}
                                    onSuccess={loadTickets}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserDashboard;
