import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppRoutes } from "./routes";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Web3Provider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: "#4aed88",
                  },
                },
                error: {
                  duration: 4000,
                  theme: {
                    primary: "#ff4b4b",
                  },
                },
              }}
            />
            <Navbar />
            <main className="flex-1 flex justify-center items-start py-8 px-4">
              <div className="w-full max-w-4xl mx-auto">
                <AppRoutes />
              </div>
            </main>
          </div>
        </Web3Provider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
