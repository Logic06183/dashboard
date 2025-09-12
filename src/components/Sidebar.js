import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ setShowOrderForm }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary bg-opacity-10' : '';
  };

  return (
    <aside className="w-64 bg-secondary border-r border-secondary-light">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">John Dough's</h1>
        <h2 className="text-sm text-gray-400">Sourdough Pizzeria</h2>
      </div>
      
      <div className="p-4 border-t border-secondary-light">
        <h2 className="text-lg font-semibold mb-2">Store Information</h2>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Address:</span> 44 1st Avenue, Linden, Randburg, Johannesburg</p>
          <p><span className="font-medium">Hours:</span> 12:00 - 20:30</p>
          <p><span className="font-medium">Phone:</span> 061 525 6829</p>
          <p><span className="font-medium">Rating:</span> ★★★★★ (4.8)</p>
          <p><span className="font-medium">Est:</span> 2022</p>
        </div>
      </div>
      
      <div className="p-4 border-t border-secondary-light">
        <button
          onClick={() => setShowOrderForm(true)}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 4v16m8-8H4"></path>
          </svg>
          New Order
        </button>
      </div>
      
      <nav className="mt-4">
        <Link
          to="/"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Dashboard
        </Link>

        <Link
          to="/kitchen"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/kitchen')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          Kitchen Display
        </Link>

        <Link
          to="/menu"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/menu')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          Menu Management
        </Link>

        <Link
          to="/inventory"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/inventory')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          Inventory Analysis
        </Link>

        <Link
          to="/stock"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/stock')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
          </svg>
          📦 Update Stock
        </Link>

        <Link
          to="/analytics"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/analytics')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Analytics
        </Link>

        <Link
          to="/waste"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/waste')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Waste Management
        </Link>

        <Link
          to="/cleanup"
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-primary hover:bg-opacity-10 ${isActive('/cleanup')}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Order Cleanup Tool
        </Link>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-secondary-light">
        <div className="flex items-center text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          System Online
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>John Dough's, Linden</p>
          <p>Est. 2022 • Family-run</p>
          <p>4.8 ★ (Joburg.co.za)</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
