import React, { useState, useEffect } from 'react';
import InventoryManagement from '../InventoryManagement';

const InventoryPage = ({ orders = [], archivedOrders = [] }) => {
  // Combine active and archived orders for a complete history
  const allOrders = [...orders, ...archivedOrders];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>
      <p className="text-gray-600 mb-6">
        Track inventory levels, analyze ingredient usage, and forecast future needs
        based on order history. This helps with planning ingredient purchases and
        identifying popular menu items.
      </p>
      <InventoryManagement orders={allOrders} />
    </div>
  );
};

export default InventoryPage;
