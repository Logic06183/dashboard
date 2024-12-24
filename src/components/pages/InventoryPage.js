import React from 'react';
import InventoryManagement from '../InventoryManagement';

const InventoryPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Inventory</h1>
      <InventoryManagement />
    </div>
  );
};

export default InventoryPage;
