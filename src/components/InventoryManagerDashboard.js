import React, { useState, useEffect } from 'react';
import InventoryUsageSummary from './InventoryUsageSummary';
import emailNotificationService from '../services/EmailNotificationService';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import BulkStockUpdateModal from './BulkStockUpdateModal';
import EndOfDayModal from './EndOfDayModal';
import NotificationSettings from './NotificationSettings';
import DailyNotificationService from '../services/DailyNotificationService';
import FirebaseService from '../services/FirebaseService';

const InventoryManagerDashboard = () => {
  const [managerEmail, setManagerEmail] = useState('');
  const [emailSchedule, setEmailSchedule] = useState('weekly');
  const [isScheduled, setIsScheduled] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ message: '', type: '' });
  const [exportFormat, setExportFormat] = useState('text');
  const [dailyReportsEnabled, setDailyReportsEnabled] = useState(false);
  const [lastDailyReport, setLastDailyReport] = useState(null);
  const [currentInventory, setCurrentInventory] = useState({});
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // summary, notifications, settings
  
  const { data: orders = [], loading } = useFirebaseOrders();
  
  // Load current inventory for daily reports
  useEffect(() => {
    const loadCurrentInventory = async () => {
      try {
        const inventoryData = await FirebaseService.getInventory();
        setCurrentInventory(inventoryData);
      } catch (error) {
        console.error('Error loading inventory for daily reports:', error);
      }
    };

    loadCurrentInventory();
  }, []);

  // Load saved email settings on component mount
  useEffect(() => {
    const savedSchedule = localStorage.getItem('inventoryEmailSchedule');
    if (savedSchedule) {
      try {
        const config = JSON.parse(savedSchedule);
        setManagerEmail(config.recipientEmail || '');
        setEmailSchedule(config.frequency || 'weekly');
        setIsScheduled(config.enabled || false);
      } catch (error) {
        console.error('Error loading email schedule:', error);
      }
    }

    // Load manager email from localStorage if available
    const savedEmail = localStorage.getItem('inventoryManagerEmail');
    if (savedEmail && !managerEmail) {
      setManagerEmail(savedEmail);
    }
    
    // Check daily report settings
    const dailyReportEnabled = localStorage.getItem('dailyReportsEnabled') === 'true';
    setDailyReportsEnabled(dailyReportEnabled);
    
    // Load last daily report timestamp
    const lastReport = localStorage.getItem('lastDailyReportSent');
    if (lastReport) {
      setLastDailyReport(new Date(lastReport));
    }
    
    // Check if daily report should be sent automatically
    if (dailyReportEnabled && managerEmail) {
      checkAndSendDailyReport();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save manager email when it changes
  useEffect(() => {
    if (managerEmail) {
      localStorage.setItem('inventoryManagerEmail', managerEmail);
    }
  }, [managerEmail]);

  // Check and send daily report if needed
  const checkAndSendDailyReport = async () => {
    if (!managerEmail || !currentInventory || Object.keys(currentInventory).length === 0) {
      return;
    }
    
    if (emailNotificationService.shouldSendDailyReport()) {
      await handleSendDailyReport();
    }
  };
  
  // Send daily stock report
  const handleSendDailyReport = async () => {
    if (!managerEmail) {
      setEmailStatus({ message: 'Please enter manager email address', type: 'error' });
      return;
    }
    
    if (!currentInventory || Object.keys(currentInventory).length === 0) {
      setEmailStatus({ message: 'No inventory data available for daily report', type: 'error' });
      return;
    }
    
    setEmailStatus({ message: 'Sending daily stock report...', type: 'info' });
    
    try {
      // Get today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderTime || order.createdAt || Date.now());
        return orderDate >= today;
      });
      
      const result = await emailNotificationService.sendAutomatedDailyReport(
        currentInventory,
        todayOrders,
        managerEmail
      );
      
      if (result.success) {
        setEmailStatus({ message: 'Daily stock report sent successfully!', type: 'success' });
        setLastDailyReport(new Date());
      } else {
        setEmailStatus({ message: `Failed to send daily report: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setEmailStatus({ message: `Error: ${error.message}`, type: 'error' });
    }
    
    // Clear status after 5 seconds
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };
  
  // Enable/disable daily reports
  const toggleDailyReports = () => {
    const newState = !dailyReportsEnabled;
    setDailyReportsEnabled(newState);
    localStorage.setItem('dailyReportsEnabled', newState.toString());
    
    if (newState) {
      setEmailStatus({ message: 'Daily reports enabled! Reports will be sent automatically around 10 PM.', type: 'success' });
    } else {
      setEmailStatus({ message: 'Daily reports disabled.', type: 'info' });
    }
    
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };
  
  // Send immediate summary email
  const handleSendSummary = async () => {
    if (!managerEmail) {
      setEmailStatus({ message: 'Please enter manager email address', type: 'error' });
      return;
    }

    if (!orders || orders.length === 0) {
      setEmailStatus({ message: 'No order data available to summarize', type: 'error' });
      return;
    }

    setEmailStatus({ message: 'Sending summary...', type: 'info' });

    try {
      // Calculate summary data
      const summaryData = calculateSummaryData(orders, 'last7days');
      
      const result = await emailNotificationService.sendInventorySummary(
        summaryData,
        managerEmail,
        'Inventory Manager'
      );

      if (result.success) {
        setEmailStatus({ message: 'Summary sent successfully!', type: 'success' });
      } else {
        setEmailStatus({ message: `Failed to send email: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setEmailStatus({ message: `Error: ${error.message}`, type: 'error' });
    }

    // Clear status after 5 seconds
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };

  // Schedule recurring emails
  const handleScheduleEmails = () => {
    if (!managerEmail) {
      setEmailStatus({ message: 'Please enter manager email address', type: 'error' });
      return;
    }

    const result = emailNotificationService.scheduleRecurringSummary(emailSchedule, managerEmail);
    
    if (result.success) {
      setIsScheduled(true);
      setEmailStatus({ message: result.message, type: 'success' });
    } else {
      setEmailStatus({ message: 'Failed to schedule emails', type: 'error' });
    }

    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };

  // Disable scheduled emails
  const handleDisableSchedule = () => {
    localStorage.removeItem('inventoryEmailSchedule');
    setIsScheduled(false);
    setEmailStatus({ message: 'Email schedule disabled', type: 'info' });
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 3000);
  };

  // Test email configuration
  const handleTestEmail = async () => {
    if (!managerEmail) {
      setEmailStatus({ message: 'Please enter manager email address', type: 'error' });
      return;
    }

    setEmailStatus({ message: 'Testing email configuration...', type: 'info' });

    const result = await emailNotificationService.testEmailConfiguration(managerEmail);
    
    if (result.success) {
      setEmailStatus({ message: 'Test email sent successfully!', type: 'success' });
    } else {
      setEmailStatus({ message: `Test email failed: ${result.message}`, type: 'error' });
    }

    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };

  // Export summary data
  const handleExportSummary = () => {
    if (!orders || orders.length === 0) {
      setEmailStatus({ message: 'No data available to export', type: 'error' });
      return;
    }

    const summaryData = calculateSummaryData(orders, 'last7days');
    
    if (exportFormat === 'csv') {
      exportToCSV(summaryData);
    } else if (exportFormat === 'json') {
      exportToJSON(summaryData);
    } else {
      exportToText(summaryData);
    }

    setEmailStatus({ message: 'Data exported successfully!', type: 'success' });
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 3000);
  };

  // Calculate summary data helper function
  const calculateSummaryData = (ordersData, timeRange) => {
    // This would use the same logic as InventoryUsageSummary
    // For brevity, returning a simplified version
    const totalOrders = ordersData.length;
    const totalPizzas = ordersData.reduce((sum, order) => 
      sum + (order.pizzas ? order.pizzas.reduce((pSum, pizza) => pSum + (pizza.quantity || 1), 0) : 0), 0);
    const totalDrinks = ordersData.reduce((sum, order) => 
      sum + (order.coldDrinks ? order.coldDrinks.reduce((dSum, drink) => dSum + (drink.quantity || 1), 0) : 0), 0);
    
    return {
      totalOrders,
      totalPizzas,
      totalDrinks,
      totalCost: 1250.75, // Placeholder - would calculate from ingredients
      categories: {
        'dough': { totalCost: 350.50 },
        'cheese': { totalCost: 275.25 },
        'meat': { totalCost: 425.00 },
        'vegetable': { totalCost: 200.00 }
      },
      timeRange
    };
  };

  // Export functions
  const exportToCSV = (data) => {
    const csv = `Category,Cost\nTotal,${data.totalCost}\n${Object.entries(data.categories).map(([cat, data]) => `${cat},${data.totalCost}`).join('\n')}`;
    downloadFile(csv, 'inventory-summary.csv', 'text/csv');
  };

  const exportToJSON = (data) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'inventory-summary.json', 'application/json');
  };

  const exportToText = (data) => {
    const text = `Inventory Summary\nTotal Orders: ${data.totalOrders}\nTotal Pizzas: ${data.totalPizzas}\nTotal Drinks: ${data.totalDrinks}\nTotal Cost: R${data.totalCost}`;
    downloadFile(text, 'inventory-summary.txt', 'text/plain');
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Handle bulk stock update
  const handleBulkStockUpdate = async (changes) => {
    try {
      // Get current inventory and merge changes
      const currentData = await FirebaseService.getInventory();
      const updatedInventory = { ...currentData };

      // Apply changes
      Object.entries(changes).forEach(([ingredient, data]) => {
        updatedInventory[ingredient] = {
          ...updatedInventory[ingredient],
          ...data
        };
      });

      // Update inventory in Firebase
      await FirebaseService.updateInventory(updatedInventory);

      // Reload inventory
      const inventoryData = await FirebaseService.getInventory();
      setCurrentInventory(inventoryData);

      setEmailStatus({
        message: `Updated ${Object.keys(changes).length} ingredients successfully!`,
        type: 'success'
      });
      setTimeout(() => setEmailStatus({ message: '', type: '' }), 3000);

    } catch (error) {
      console.error('Error updating bulk stock:', error);
      setEmailStatus({
        message: 'Failed to update inventory: ' + error.message,
        type: 'error'
      });
      setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
    }
  };
  
  // Handle end of day completion
  const handleEndOfDayComplete = async (result) => {
    console.log('End of day processing completed:', result);

    // Reload inventory after processing
    try {
      const inventoryData = await FirebaseService.getInventory();
      setCurrentInventory(inventoryData);
    } catch (error) {
      console.error('Error reloading inventory:', error);
    }

    setEmailStatus({
      message: `End of day processing completed! ${result.ordersProcessed} orders processed, ${result.ingredientsUpdated} ingredients updated.`,
      type: 'success'
    });
    setTimeout(() => setEmailStatus({ message: '', type: '' }), 5000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Inventory Manager Dashboard</h2>
        
        {/* Daily Reports Status */}
        {dailyReportsEnabled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">📅</span>
                <div>
                  <span className="text-blue-800 font-medium">
                    Daily Stock Reports Enabled
                  </span>
                  <p className="text-sm text-blue-600">
                    Automatic reports sent to {managerEmail} around 10 PM daily
                  </p>
                  {lastDailyReport && (
                    <p className="text-xs text-blue-500">
                      Last sent: {lastDailyReport.toLocaleDateString('en-ZA')} at {lastDailyReport.toLocaleTimeString('en-ZA')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSendDailyReport}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Send Now
              </button>
            </div>
          </div>
        )}
        
        {/* Manager Configuration */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Manager Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Email Address
              </label>
              <input
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@johndoughs.co.za"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Schedule
              </label>
              <select
                value={emailSchedule}
                onChange={(e) => setEmailSchedule(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Status Messages */}
          {emailStatus.message && (
            <div className={`p-3 rounded-md mb-4 ${
              emailStatus.type === 'success' ? 'bg-green-100 text-green-700' :
              emailStatus.type === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {emailStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendDailyReport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              📊 Send Daily Stock Report
            </button>
            
            <button
              onClick={handleSendSummary}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              📧 Send Usage Summary
            </button>
            
            {!isScheduled ? (
              <button
                onClick={handleScheduleEmails}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                ⏰ Schedule {emailSchedule} Emails
              </button>
            ) : (
              <button
                onClick={handleDisableSchedule}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                🛑 Disable Schedule
              </button>
            )}
            
            <button
              onClick={toggleDailyReports}
              className={`px-4 py-2 rounded-md ${
                dailyReportsEnabled 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {dailyReportsEnabled ? '🛑 Disable Daily Reports' : '📅 Enable Daily Reports'}
            </button>
            
            <button
              onClick={handleTestEmail}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              🧪 Test Email
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Export Summary</h3>
          
          <div className="flex items-center gap-4 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Export Format:
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="text">Text</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            
            <button
              onClick={handleExportSummary}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              💾 Export Data
            </button>
          </div>
        </div>

        {/* Schedule Status */}
        {isScheduled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-green-800 font-medium">
                {emailSchedule.charAt(0).toUpperCase() + emailSchedule.slice(1)} summaries are scheduled to: {managerEmail}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Daily Stock Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Today's Stock Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">Orders Today</h4>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(order => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const orderDate = new Date(order.orderTime || order.createdAt || Date.now());
                return orderDate >= today;
              }).length}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Inventory Value</h4>
            <p className="text-2xl font-bold text-green-600">
              R{Object.entries(currentInventory).reduce((total, [ingredient, data]) => {
                // Simple cost calculation - would need to import ingredients data
                return total + (data.amount || 0) * 5; // Rough estimate
              }, 0).toFixed(0)}
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800">Low Stock Items</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {Object.entries(currentInventory).filter(([ingredient, data]) => 
                data.amount <= (data.threshold || 0)
              ).length}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800">Total Ingredients</h4>
            <p className="text-2xl font-bold text-purple-600">
              {Object.keys(currentInventory).length}
            </p>
          </div>
        </div>
        
        {/* Enhanced Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3 text-gray-700">Inventory Management Actions</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              📦 Bulk Stock Update
            </button>
            <button
              onClick={() => setShowEndOfDayModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              🌙 End of Day Processing
            </button>
            <button
              onClick={() => window.location.hash = '#/inventory'}
              className="bg-purple-100 text-purple-700 px-3 py-2 rounded hover:bg-purple-200 transition-colors"
            >
              📊 View Full Inventory
            </button>
            <button
              onClick={() => {
                const lowStock = Object.entries(currentInventory)
                  .filter(([ingredient, data]) => data.amount <= (data.threshold || 0))
                  .map(([ingredient, data]) => `${ingredient.replace(/_/g, ' ')}: ${data.amount} ${data.unit}`);
                
                if (lowStock.length > 0) {
                  alert(`Low Stock Items:\n\n${lowStock.join('\n')}`);
                } else {
                  alert('All inventory levels are good! 🎉');
                }
              }}
              className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-200 transition-colors"
            >
              ⚠️ Check Low Stock
            </button>
            <button
              onClick={() => DailyNotificationService.testNotification()}
              className="bg-orange-100 text-orange-700 px-3 py-2 rounded hover:bg-orange-200 transition-colors"
            >
              📧 Test Notification
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabbed Interface */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Headers */}
        <div className="border-b">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Usage Summary
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notification Settings
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'summary' && <InventoryUsageSummary orders={orders} />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
      
      {/* Modals */}
      <BulkStockUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        currentInventory={currentInventory}
        onSave={handleBulkStockUpdate}
      />
      
      <EndOfDayModal
        isOpen={showEndOfDayModal}
        onClose={() => setShowEndOfDayModal(false)}
        onComplete={handleEndOfDayComplete}
      />
    </div>
  );
};

export default InventoryManagerDashboard;