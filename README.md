# 🎫 Evenix - Decentralized Event Ticketing Platform

![Evenix Logo](https://img.shields.io/badge/Evenix-DApp-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Solidity](https://img.shields.io/badge/Solidity-0.8.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-orange)
![Network](https://img.shields.io/badge/Network-Sepolia-blueviolet)

Evenix is a revolutionary decentralized event ticketing platform that leverages blockchain technology to provide a secure, transparent, and efficient way to buy, sell, and manage event tickets. Built on the Ethereum blockchain, Evenix eliminates intermediaries, reduces fraud, and ensures fair ticket distribution. Currently live on the Sepolia testnet, our smart contracts are battle-tested and ready for production deployment.

## 🌟 Features

- **Decentralized Ticketing**: Secure and transparent ticket management on the blockchain
- **Smart Contract Integration**: Automated and trustless ticket transactions
- **User-Friendly Interface**: Modern and intuitive UI built with React
- **Secure Authentication**: Web3 wallet integration for secure transactions
- **Real-time Updates**: Instant ticket status and availability updates
- **Event Management**: Comprehensive tools for event organizers
- **Secondary Market**: Secure peer-to-peer ticket resale platform

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Vite
- Web3.js
- Ethers.js

### Backend
- Solidity
- Hardhat
- Ethereum Smart Contracts
- Node.js

## 📋 Prerequisites

- Node.js (v14 or higher)
- Hardhat
- MetaMask or any Web3 wallet
- Git
- npm or yarn

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/evenix.git
   cd evenix
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../event-dapp-backend
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the backend directory
   - Add your Ethereum network configuration
   - Add your private keys (for development only)

4. **Deploy smart contracts**
   ```bash
   cd event-dapp-backend
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

5. **Start the development servers**
   ```bash
   # Start frontend
   cd frontend
   npm run dev

   # Start backend (in a new terminal)
   cd event-dapp-backend
   npx hardhat node
   ```

## 📱 Usage

1. Connect your Web3 wallet (MetaMask recommended)
2. Browse available events
3. Select and purchase tickets
4. Manage your tickets in your profile
5. Resell tickets if needed

## 🔒 Security

- Smart contracts are thoroughly tested and audited
- Secure wallet integration
- Encrypted data transmission
- Regular security updates

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please:
- Open an issue in the GitHub repository
- Contact the development team
- Join our community Discord

## 🙏 Acknowledgments

- Ethereum Foundation
- Hardhat Team
- React Community

---

Built with ❤️ by the Evenix Team 