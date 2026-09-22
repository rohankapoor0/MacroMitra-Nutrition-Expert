import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Sidebar from './components/shared/Sidebar';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Meals from './pages/Meals';
import Database from './pages/Database';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="flex min-h-screen bg-surface text-on-surface">
          {/* Main Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 ml-[320px] flex flex-col min-h-screen">
            <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-12 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/meals" element={<Meals />} />
                <Route path="/database" element={<Database />} />
              </Routes>
            </main>
            
            <footer className="py-8 px-12 border-t border-slate-700/50 text-center lg:text-left">
              <p className="text-text-muted text-xs">
                © 2024 MacroMitra. Built with ❤️ for healthy living. Data localized for privacy.
              </p>
            </footer>
          </div>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
