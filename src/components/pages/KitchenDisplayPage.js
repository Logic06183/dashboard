import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableKitchenDisplay from '../TableKitchenDisplay';
import useQueueCalculator from '../../hooks/useQueueCalculator';

const KitchenDisplayPage = ({ isLoading, onStatusChange, onPizzaStatusChange, onArchiveOrder }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { 
    queueData, 
    totalPizzasInQueue, 
    activeOrdersCount, 
    estimatedWaitTime,
    formatTimeEstimate,
    isRushMode,
    isQueueBusy
  } = useQueueCalculator();
  
  // Enable automatic time updates for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-secondary-dark">
      <header className="bg-secondary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-4">
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
              <button
                onClick={() => navigate('/settings')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Queue Settings
              </button>
            </div>
          </div>
          
          {/* Queue Overview Dashboard */}
          {queueData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`bg-secondary-light rounded-lg p-4 text-center ${isQueueBusy() ? 'border-2 border-red-500' : ''}`}>
                <div className="text-2xl font-bold text-primary">{totalPizzasInQueue}</div>
                <div className="text-sm text-gray-400">Pizzas in Queue</div>
                {totalPizzasInQueue > 10 && (
                  <div className="text-xs text-orange-400 mt-1">High Volume</div>
                )}
              </div>
              
              <div className="bg-secondary-light rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{activeOrdersCount}</div>
                <div className="text-sm text-gray-400">Active Orders</div>
              </div>
              
              <div className={`bg-secondary-light rounded-lg p-4 text-center ${isQueueBusy() ? 'border-2 border-orange-500' : ''}`}>
                <div className="text-2xl font-bold text-primary">{formatTimeEstimate(estimatedWaitTime)}</div>
                <div className="text-sm text-gray-400">Est. Wait for New Orders</div>
                {isQueueBusy() && (
                  <div className="text-xs text-red-400 mt-1">Queue Busy</div>
                )}
              </div>
              
              <div className="bg-secondary-light rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-primary">
                  {isRushMode ? '🔥 Rush' : '✅ Normal'}
                </div>
                <div className="text-sm text-gray-400">
                  {queueData.settings?.pizzaCapacity || 3} Pizza Capacity
                </div>
                {isRushMode && (
                  <div className="text-xs text-orange-400 mt-1">1.5x Multiplier Active</div>
                )}
              </div>
            </div>
          )}
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
