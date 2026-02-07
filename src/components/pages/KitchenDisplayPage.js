import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableKitchenDisplay from '../TableKitchenDisplay';
import ImprovedKitchenDisplay from '../ImprovedKitchenDisplay';
import useFirebaseOrders from '../../hooks/useFirebaseOrders';
import useQueueCalculator from '../../hooks/useQueueCalculator';
import { updatePizzaStatus, updateOrder } from '../../services/FirebaseService';

// Wrapper component to connect ImprovedKitchenDisplay with Firebase
const ImprovedKitchenDisplayWrapper = ({ onStatusChange, onPizzaStatusChange, onArchiveOrder }) => {
  const { data: firebaseOrders, loading, error } = useFirebaseOrders();

  const handlePizzaToggle = async (orderId, pizzaIndex, isCooked) => {
    try {
      await updatePizzaStatus(orderId, pizzaIndex, isCooked);
      if (onPizzaStatusChange) {
        onPizzaStatusChange(orderId, pizzaIndex, isCooked);
      }
    } catch (error) {
      console.error('Error updating pizza status:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      if (onStatusChange) {
        onStatusChange(orderId, newStatus);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading orders: {error.message}</div>
      </div>
    );
  }

  return (
    <ImprovedKitchenDisplay
      orders={firebaseOrders}
      onStatusChange={handleStatusChange}
      onPizzaToggle={handlePizzaToggle}
    />
  );
};

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
          
          {/* Rush Period and Delay Alerts */}
          {queueData && (
            <div className="mt-4 space-y-2">
              {/* Rush Period Alert */}
              {queueData.rushInfo?.isRushPeriod && (
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-orange-600 font-semibold mr-2">⚠️ RUSH PERIOD</span>
                      <span className="text-orange-700">{queueData.rushInfo.timeSlot}</span>
                    </div>
                    <div className="text-sm text-orange-600">
                      Expecting ~{queueData.rushInfo.expectedPizzas} pizzas this hour
                    </div>
                  </div>
                </div>
              )}
              
              {/* Window Customer Delay Notifications */}
              {queueData.delayedOrders && queueData.delayedOrders.length > 0 && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <div className="text-red-800 font-semibold mb-2">
                    📞 WINDOW CUSTOMERS TO NOTIFY ({queueData.delayedOrders.length})
                  </div>
                  {queueData.delayedOrders.map(order => (
                    <div key={order.orderId} className="bg-white rounded p-2 mb-2 border border-red-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-red-700">{order.customerName}</div>
                          <div className="text-sm text-red-600">
                            Original: {order.originalEstimate}min → Now: {order.newEstimate}min (+{order.delayMinutes}min)
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{order.reason}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Order #{order.orderId.slice(-6)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Predictive Info for Staff */}
              {queueData.rushInfo?.confidence === 'high' && (
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-blue-800 font-semibold">📊 PREDICTIVE INTEL</div>
                    <div className="text-sm text-blue-600">
                      Window estimates include predicted volume
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Toggle between old and new UI - using improved by default */}
        <ImprovedKitchenDisplayWrapper
          onStatusChange={onStatusChange}
          onPizzaStatusChange={onPizzaStatusChange}
          onArchiveOrder={onArchiveOrder}
        />

        {/* Old TableKitchenDisplay - kept for reference */}
        {/* <TableKitchenDisplay
          onStatusChange={onStatusChange}
          onPizzaStatusChange={onPizzaStatusChange}
          onArchiveOrder={onArchiveOrder}
        /> */}
      </main>
    </div>
  );
};

export default KitchenDisplayPage;
