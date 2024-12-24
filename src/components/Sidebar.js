import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary bg-opacity-10' : '';
  };

  return (
    <aside className="w-64 bg-secondary border-r border-secondary-light">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary">John Dough's</h1>
      </div>
      
      <nav className="mt-8">
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
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-secondary-light">
        <div className="flex items-center text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          System Online
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
