import React from 'react';
import KitchenDisplay from '../KitchenDisplay';

const KitchenDisplayPage = ({ orders, onStatusChange }) => {
  return (
    <div className="min-h-screen bg-secondary-dark">
      <header className="bg-secondary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">John Dough's Kitchen Display</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-secondary-light px-4 py-2 rounded-lg">
              <span className="text-primary font-medium">Active Orders: </span>
              <span className="text-yellow-500 font-bold">{orders.filter(o => !['ready', 'delivered'].includes(o.status)).length}</span>
            </div>
            <div className="bg-secondary-light px-4 py-2 rounded-lg">
              <span className="text-primary font-medium">Time: </span>
              <span className="text-primary font-mono">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <KitchenDisplay orders={orders} onStatusChange={onStatusChange} />
      </main>
    </div>
  );
};

export default KitchenDisplayPage;
