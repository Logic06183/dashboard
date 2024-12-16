// src/components/StatsCard.js
import React from 'react';

const StatsCard = ({ title, value, change }) => {
  const isPositive = change?.startsWith('+');
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-gray-600 text-base font-normal mb-4">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {change && (
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;