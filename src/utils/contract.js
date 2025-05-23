import { ethers } from 'ethers';

// Import contract ABIs
import EventCoreABI from '../abis/EventCore.sol/EventCore.json';
import EventFactoryABI from '../abis/EventFactory.sol/EventFactory.json';
import EventDiscoveryABI from '../abis/EventDiscovery.sol/EventDiscovery.json';
import TicketManagerABI from '../abis/TicketManager.sol/TicketManager.json';
import UserTicketHubABI from '../abis/UserTicketHub.sol/UserTicketHub.json';

// Import contract addresses
import { CONTRACT_ADDRESSES } from './contractAddresses';

// Contract instances
export const getContracts = async (signer) => {
  if (!signer) {
    console.error('No signer provided to getContracts');
    return null;
  }
  console.log('getContracts called with signer:', signer);

  try {
    // Log network information
    const network = await signer.provider.getNetwork();
    console.log('Connected to network:', {
      chainId: network.chainId,
      name: network.name
    });

    console.log('Using contract addresses:', CONTRACT_ADDRESSES);
    
    // Verify ABIs
    if (!EventFactoryABI?.abi) {
      throw new Error('EventFactory ABI is missing or invalid');
    }
    if (!EventDiscoveryABI?.abi) {
      throw new Error('EventDiscovery ABI is missing or invalid');
    }
    if (!UserTicketHubABI?.abi) {
      throw new Error('UserTicketHub ABI is missing or invalid');
    }

    const eventFactoryAddress = CONTRACT_ADDRESSES.eventFactory;
    if (!eventFactoryAddress) {
      throw new Error('EventFactory address is undefined in CONTRACT_ADDRESSES');
    }
    console.log('EventFactory Address:', eventFactoryAddress);

    // Create contract instances with error checking
    const eventFactory = new ethers.Contract(eventFactoryAddress, EventFactoryABI.abi, signer);
    if (!eventFactory.target) {
      throw new Error('EventFactory contract initialization failed');
    }

    const eventDiscovery = new ethers.Contract(CONTRACT_ADDRESSES.eventDiscovery, EventDiscoveryABI.abi, signer);
    if (!eventDiscovery.target) {
      throw new Error('EventDiscovery contract initialization failed');
    }

    const userTicketHub = new ethers.Contract(CONTRACT_ADDRESSES.userTicketHub, UserTicketHubABI.abi, signer);
    if (!userTicketHub.target) {
      throw new Error('UserTicketHub contract initialization failed');
    }

    const contracts = {
      eventFactory,
      eventDiscovery,
      userTicketHub,
      signer
    };

    // Verify contract functions exist
    if (typeof eventFactory.nextEventId !== 'function') {
      throw new Error('nextEventId function not found in EventFactory contract');
    }

    console.log('Contract instances created successfully:', {
      eventFactoryAddress: contracts.eventFactory.target,
      eventDiscoveryAddress: contracts.eventDiscovery.target,
      userTicketHubAddress: contracts.userTicketHub.target
    });

    return contracts;
  } catch (error) {
    console.error('Error initializing contracts:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error; // Rethrow to handle in component
  }
};

// Helper functions for formatting data
export const formatEvent = (event) => {
  return {
    id: event.id.toString(),
    name: event.name,
    description: event.description || '',
    date: new Date(Number(event.date) * 1000).toLocaleString(),
    price: ethers.formatEther(event.price),
    totalTickets: event.totalTickets.toString(),
    ticketsSold: event.ticketsSold?.toString() || '0',
    organizer: event.organizer,
    isActive: event.isActive,
    category: event.category || 'other',
    location: event.location || '',
    imageUrl: event.imageUrl || ''
  };
};

export const formatTicket = (ticket) => {
  return {
    id: ticket.id.toString(),
    eventId: ticket.eventId.toString(),
    owner: ticket.owner,
    purchaseDate: new Date(Number(ticket.purchaseDate) * 1000).toLocaleString(),
    isUsed: ticket.isUsed,
    transferable: ticket.transferable,
    price: ethers.formatEther(ticket.price)
  };
};

// Contract interaction functions
export const createEvent = async (contracts, eventData) => {
  const { name, date, price, totalTickets } = eventData;
  
  // Convert date to Unix timestamp (seconds)
  const timestamp = Math.floor(new Date(date).getTime() / 1000);
  
  // Convert price to Wei
  const priceInWei = ethers.parseEther(price.toString());
  
  // Convert totalTickets to number
  const tickets = parseInt(totalTickets);

  try {
    const tx = await contracts.eventFactory.createEvent(
      name,
      timestamp,
      priceInWei,
      tickets
    );
    
    return await tx.wait();
  } catch (error) {
    console.error('Contract error details:', error);
    throw error;
  }
};

export const purchaseTicket = async (contracts, eventId, quantity, totalPriceEth) => {
  if (!contracts?.userTicketHub || !contracts.signer) {
    throw new Error('UserTicketHub or signer not available');
  }
  try {
    // Call buyTickets on UserTicketHub so userTickets mapping is updated
    const tx = await contracts.userTicketHub.buyTickets(eventId, quantity, {
      value: ethers.parseEther(totalPriceEth.toString())
    });
    return await tx.wait();
  } catch (error) {
    console.error('Error in purchaseTicket utility:', error);
    throw error;
  }
};

export const transferTicket = async (contracts, eventId, to, quantity) => {
  try {
    // Get the event contract address
    const eventContractAddress = await contracts.eventFactory.getEventContract(eventId);
    if (!eventContractAddress || eventContractAddress === ethers.ZeroAddress) {
      throw new Error('Event contract not found');
    }

    // Create EventCore instance
    const eventCore = new ethers.Contract(eventContractAddress, EventCoreABI.abi, contracts.signer);

    // Get event details to calculate transfer amount
    const [, , , ticketPrice] = await eventCore.getEventDetails();
    const transferAmount = ticketPrice * BigInt(quantity);

    // Transfer tickets through UserTicketHub with payment
    const tx = await contracts.userTicketHub.transferTickets(eventId, to, quantity, {
      value: transferAmount
    });
    
    return await tx.wait();
  } catch (error) {
    console.error('Error in transferTicket utility:', error);
    throw error;
  }
};

export const getEventDetails = async (contracts, eventId) => {
  try {
    // Get the event contract address from EventFactory
    const eventContractAddress = await contracts.eventFactory.getEventContract(eventId);
    if (!eventContractAddress || eventContractAddress === ethers.ZeroAddress) {
      throw new Error('Event contract not found');
    }

    // Create EventCore instance
    const eventCore = new ethers.Contract(eventContractAddress, EventCoreABI.abi, contracts.signer);
    const event = await eventCore.getEventDetails();
    return formatEvent(event);
  } catch (error) {
    console.error('Error getting event details:', error);
    throw error;
  }
};

export const registerUser = async (contracts, userName, email) => {
  try {
    const tx = await contracts.userTicketHub.registerUser(userName, email);
    return await tx.wait();
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const getUserTickets = async (contracts, userAddress) => {
  if (!contracts?.userTicketHub || !contracts?.eventFactory) {
    console.error('UserTicketHub or EventFactory contract not found in contracts object for getUserTickets');
    return [];
  }

  try {
    // Fetch the full user profile
    const userProfile = await contracts.userTicketHub.userProfiles(userAddress);
    console.log('User Profile in getUserTickets:', userProfile);

    // If user is not registered (assuming isRegistered is a boolean field in the struct)
    if (!userProfile || !userProfile.isRegistered) {
      console.log(`User ${userAddress} is not registered.`);
      return [];
    }

    const tickets = [];
    
    // Get the total number of event IDs created so far
    let eventCount;
    try {
      const nextEventId = await contracts.eventFactory.nextEventId();
      console.log('Raw nextEventId value:', nextEventId);
      // Convert BigInt to Number safely
      eventCount = nextEventId ? Number(nextEventId) : 0;
    } catch (error) {
      console.error('Error fetching nextEventId:', error);
      // Fallback to getting events from EventDiscovery
      const allEvents = await contracts.eventDiscovery.getAllEvents();
      eventCount = allEvents.length;
    }
    
    console.log(`Total event IDs to check: ${eventCount}`);

    // If we have no events, return early
    if (eventCount === 0) {
      return [];
    }

    for (let i = 0; i < eventCount; i++) {
      const eventId = i;
      console.log("Checking tickets for user:", userAddress, "event:", eventId);
      let userTicketCountForEvent = 0;
      
      try {
        userTicketCountForEvent = await contracts.userTicketHub.getUserTicketCount(userAddress, eventId);
        userTicketCountForEvent = Number(userTicketCountForEvent);
        console.log("User has", userTicketCountForEvent, "tickets for event", eventId);
      } catch (e) {
        console.warn(`Could not get ticket count for user ${userAddress}, event ${eventId}: ${e.message}`);
        continue;
      }

      if (userTicketCountForEvent > 0) {
        try {
          const eventContractAddress = await contracts.eventFactory.getEventContract(eventId);
          if (!eventContractAddress || eventContractAddress === ethers.ZeroAddress) {
            console.warn(`Event contract address for event ID ${eventId} is invalid.`);
            continue;
          }

          const eventCore = new ethers.Contract(eventContractAddress, EventCoreABI.abi, contracts.signer);
          const eventDetails = await eventCore.getEventDetails();
          
          for (let j = 0; j < userTicketCountForEvent; j++) {
            tickets.push(formatTicket({
              id: `${eventId}-${j}`,
              eventId: eventId.toString(),
              owner: userAddress,
              purchaseDate: Math.floor(Date.now() / 1000),
              isUsed: false,
              transferable: true,
              price: eventDetails._price
            }));
          }
        } catch (error) {
          console.warn(`Error processing event ${eventId}:`, error);
          continue;
        }
      }
    }

    console.log(`Found ${tickets.length} tickets for user ${userAddress}:`, tickets);
    return tickets;
  } catch (error) {
    console.error('Error in getUserTickets:', error);
    if (error.message.includes('user not registered') || error.message.includes('invalid user')) {
      return [];
    }
    throw error;
  }
};

export const searchEvents = async (contracts, query) => {
  const events = await contracts.eventDiscovery.searchEvents(query);
  return events.map(formatEvent);
};

export const getEventsByCategory = async (contracts, category) => {
  try {
    // Convert category string to enum value
    const categoryMap = {
      'music': 0,
      'sports': 1,
      'arts': 2,
      'technology': 3,
      'business': 4,
      'other': 5
    };
    
    const categoryValue = categoryMap[category.toLowerCase()] || 5; // Default to 'other' if category not found
    
    // Get events by category with a reasonable limit (e.g., 50)
    const eventIds = await contracts.eventDiscovery.getEventsByCategory(categoryValue, 50);
    const events = [];

    for (let i = 0; i < eventIds.length; i++) {
      const event = await getEventDetails(contracts, eventIds[i]);
      events.push(event);
    }

    return events;
  } catch (error) {
    console.error('Error getting events by category:', error);
    throw error;
  }
};

export const initiateTransfer = async (contracts, eventId, recipient, quantity) => {
  if (!contracts?.userTicketHub) {
    throw new Error('UserTicketHub contract not available');
  }

  try {
    // Convert eventId to number if it's a string
    const eventIdNum = typeof eventId === 'string' ? parseInt(eventId) : eventId;
    
    // Convert quantity to number if it's a string
    const quantityNum = typeof quantity === 'string' ? parseInt(quantity) : quantity;

    console.log('Initiating transfer with params:', {
      eventId: eventIdNum,
      recipient,
      quantity: quantityNum
    });

    const tx = await contracts.userTicketHub.initiateTransfer(
      eventIdNum,
      recipient,
      quantityNum
    );
    
    console.log('Transfer initiation transaction:', tx);
    const receipt = await tx.wait();
    console.log('Transfer initiation receipt:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error initiating transfer:', error);
    throw new Error(error.message || 'Failed to initiate transfer');
  }
};

export const acceptTransfer = async (contracts, from, eventId, amount) => {
  if (!contracts?.userTicketHub) {
    throw new Error('UserTicketHub contract not available');
  }

  try {
    // Convert eventId to number if it's a string
    const eventIdNum = typeof eventId === 'string' ? parseInt(eventId) : eventId;
    
    // Convert amount to Wei
    const amountWei = ethers.parseEther(amount.toString());

    console.log('Accepting transfer with params:', {
      from,
      eventId: eventIdNum,
      amount: amountWei.toString()
    });

    const tx = await contracts.userTicketHub.acceptTransfer(
      from,
      eventIdNum,
      { value: amountWei }
    );
    
    console.log('Transfer acceptance transaction:', tx);
    const receipt = await tx.wait();
    console.log('Transfer acceptance receipt:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error accepting transfer:', error);
    throw new Error(error.message || 'Failed to accept transfer');
  }
};

export const getPendingTransfers = async (contracts, userAddress) => {
  try {
    const pendingTransfers = [];
    const userTicketHub = contracts.userTicketHub;
    const provider = userTicketHub.runner?.provider || userTicketHub.provider;
    if (!provider) throw new Error('No provider found for contract');

    // Get the TransferInitiated event signature and filter
    const filter = userTicketHub.filters.TransferInitiated(null, userAddress);
    
    // Get events from the last 24 hours to ensure we don't miss any
    const currentBlock = await provider.getBlockNumber();
    const oneDayInBlocks = 6500; // Approximate blocks in 24 hours
    const fromBlock = Math.max(0, currentBlock - oneDayInBlocks);
    
    const logs = await userTicketHub.queryFilter(filter, fromBlock, currentBlock);

    for (const log of logs) {
      const { from, to, eventId, quantity } = log.args;
      // Check if this transfer is still pending
      const pendingQty = await userTicketHub.pendingTransfers(from, eventId, to);
      if (pendingQty > 0) {
        // Get event details
        const eventContractAddress = await contracts.eventFactory.getEventContract(eventId);
        const eventCore = new ethers.Contract(eventContractAddress, EventCoreABI.abi, contracts.signer);
        const [name, , , price] = await eventCore.getEventDetails();
        pendingTransfers.push({
          eventId: eventId.toString(),
          from,
          quantity: pendingQty.toString(),
          eventName: name,
          price: ethers.formatEther(price)
        });
      }
    }
    return pendingTransfers;
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    throw new Error('Failed to get pending transfers');
  }
};