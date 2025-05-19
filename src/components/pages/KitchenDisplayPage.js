import React, { useState, useEffect } from 'react';
import TableKitchenDisplay from '../TableKitchenDisplay';

const KitchenDisplayPage = ({ isLoading, onStatusChange, onPizzaStatusChange, onArchiveOrder }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // DISABLED: No automatic time updates to prevent auto-refreshes
  useEffect(() => {
    console.log('Automatic time updates disabled in Kitchen Display');
    // Set initial time but don't update automatically
    setCurrentTime(new Date());
    return () => {};
  }, []);
  
  return (
    <div className="min-h-screen bg-secondary-dark">
      <header className="bg-secondary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">John Dough's Kitchen Display</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-secondary-light px-4 py-2 rounded-lg">
              <span className="text-primary font-medium">Kitchen Display </span>
              <span className="text-yellow-500 font-bold">Active</span>
            </div>
            <div className="bg-secondary-light px-4 py-2 rounded-lg">
              <span className="text-primary font-medium">Time: </span>
              <span className="text-primary font-mono">
                {currentTime.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <TableKitchenDisplay 
          onStatusChange={onStatusChange}
          onPizzaStatusChange={onPizzaStatusChange}
          onArchiveOrder={onArchiveOrder}
        />
      </main>
    </div>
  );
};

export default KitchenDisplayPage;
