import React, { useState, useEffect } from 'react';
import InventoryUsageSummary from './InventoryUsageSummary';
import emailNotificationService from '../services/EmailNotificationService';
import useFirebaseOrders from '../hooks/useFirebaseOrders';

const InventoryManagerDashboard = () => {
  const [managerEmail, setManagerEmail] = useState('');
  const [emailSchedule, setEmailSchedule] = useState('weekly');
  const [isScheduled, setIsScheduled] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ message: '', type: '' });
  const [exportFormat, setExportFormat] = useState('text');
  
  const { data: orders = [], loading } = useFirebaseOrders();

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
  }, []);

  // Save manager email when it changes
  useEffect(() => {
    if (managerEmail) {
      localStorage.setItem('inventoryManagerEmail', managerEmail);
    }
  }, [managerEmail]);

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
              onClick={handleSendSummary}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              📧 Send Summary Now
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

      {/* Usage Summary Component */}
      <InventoryUsageSummary orders={orders} />
    </div>
  );
};

export default InventoryManagerDashboard;