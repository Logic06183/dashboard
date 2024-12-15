import React from 'react';
// import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Bell } from 'react-icons/fa';
// import StatsCard from './StatsCard';

// const chartData = [...];
// const barData = [...];

const NavItem = ({ icon, label, active = false, expanded = true }) => {
  return (
    <a
      href="#"
      className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 ${
        active ? 'bg-blue-50 text-blue-600' : ''
      }`}
    >
      <span className="w-6 h-6">{icon}</span>
      {expanded && <span className="ml-3">{label}</span>}
    </a>
  );
};

export default NavItem;