import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';

const LandingPage = () => {
  const { account, connectWallet } = useWeb3();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 rounded-2xl">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-95 "></div>
        
        <div className="absolute top-20 left-10 w-24 h-24 bg-white/10 rounded-full  blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-indigo-300/10 rounded-full blur-xl"></div>
        
        <div className="relative w-full px-6 z-10 rounded-2xl">
          <div className="max-w-3xl mx-auto text-center rounded-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Evenix - The Decentralized Event Management
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Create, manage, and attend events with blockchain-powered ticketing. Secure, transparent, and hassle-free.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5 mt-10 rounded-2xl">
              {!account ? (
                <button
                  onClick={connectWallet}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-2xl shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  Connect Wallet
                </button>
              ) : (
                <Link
                  to="/dashboard"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-8 rounded-2xl shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  Go to Dashboard
                </Link>
              )}
              <Link
                to="/organizer"
                className="bg-transparent hover:bg-white/20 text-white border-2 border-white font-bold py-4 px-8 rounded-2xl shadow-lg transition duration-300 transform hover:scale-105"
              >
                Create an Event
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating UI Elements */}
        <div className="hidden lg:block absolute -right-20 top-1/4 w-80 h-64 bg-white/5 backdrop-blur-lg rounded-2xl rotate-6 border border-white/10 shadow-xl"></div>
        <div className="hidden lg:block absolute -left-10 bottom-10 w-72 h-48 bg-white/5 backdrop-blur-lg rounded-2xl -rotate-6 border border-white/10 shadow-xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white rounded-2xl">
        <div className="w-full px-6 rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-3 gap-10 rounded-2xl">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-indigo-100 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">Secure Ticketing</h3>
              <p className="text-gray-600 text-center">
                Blockchain-based tickets that cannot be counterfeited or duplicated, ensuring authenticity and security.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-indigo-100 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">Transparent Transactions</h3>
              <p className="text-gray-600 text-center">
                All ticket sales and transfers are recorded on the blockchain, providing complete transparency and traceability.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-indigo-100 rounded-xl rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">Instant Verification</h3>
              <p className="text-gray-600 text-center">
                Quick and easy ticket verification at the event entrance, eliminating long queues and wait times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden rounded-2xl">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full -ml-32 -mb-32 opacity-50"></div>
        
        <div className="relative w-full px-6 z-10 rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10 rounded-2xl">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6 mx-auto">1</div>
              <h3 className="text-xl font-semibold mb-4 text-center">Connect Your Wallet</h3>
              <p className="text-gray-600 text-center">Link your Ethereum wallet to access the platform's features and manage your digital assets securely.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6 mx-auto">2</div>
              <h3 className="text-xl font-semibold mb-4 text-center">Browse or Create Events</h3>
              <p className="text-gray-600 text-center">Discover upcoming events or create your own as an organizer with customizable options and ticket types.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mb-6 mx-auto">3</div>
              <h3 className="text-xl font-semibold mb-4 text-center">Purchase or Manage Tickets</h3>
              <p className="text-gray-600 text-center">Buy tickets securely or manage your event's ticket sales with real-time analytics and attendee information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-700 opacity-95 rounded-2xl"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
        
        <div className="relative w-full px-6 z-10 text-center rounded-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join the future of event management and ticketing today.
          </p>
          {!account ? (
            <button
              onClick={connectWallet}
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-10 rounded-2xl shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Connect Wallet
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-10 rounded-2xl shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 rounded-t-3xl ">
        <div className="w-full px-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center rounded-2xl">
            <div className="mb-8 md:mb-0 rounded-2xl">
              <h2 className="text-2xl font-bold">Evenix</h2>
              <p className="text-gray-400 mt-2">The Decentralized Event Management Platform</p>
            </div>
            <div className="flex space-x-6 rounded-2xl">
              <a href="#" className="text-gray-300 hover:text-indigo-400 transition-colors duration-300">Terms</a>
              <a href="#" className="text-gray-300 hover:text-indigo-400 transition-colors duration-300">Privacy</a>
              <a href="#" className="text-gray-300 hover:text-indigo-400 transition-colors duration-300">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-gray-400 rounded-2xl">
            <p>&copy; {new Date().getFullYear()} Event DApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;