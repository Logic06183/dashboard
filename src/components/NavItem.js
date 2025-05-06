// src/components/NavItem.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ icon, label, to, expanded = true }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 ${
        isActive ? 'bg-blue-50 text-blue-600' : ''
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      {expanded && <span className="ml-3">{label}</span>}
    </Link>
  );
};

export default NavItem;