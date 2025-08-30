import React, { useState, useEffect } from 'react';
import FirebaseService from '../../services/FirebaseService';

const { getWastedOrders, getWasteAnalytics } = FirebaseService;

const WasteManagementPage = () => {
  const [wastedOrders, setWastedOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');

  // Date range options
  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: new Date() };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: new Date() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: new Date() };
      case 'all':
      default:
        return {};
    }
  };

  // Load waste data
  const loadWasteData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [wasteData, analyticsData] = await Promise.all([
        getWastedOrders({ limit: 50 }),
        getWasteAnalytics(getDateRange(dateFilter))
      ]);

      setWastedOrders(wasteData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading waste data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWasteData();
  }, [dateFilter]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get waste reason color
  const getReasonColor = (reason) => {
    if (reason?.toLowerCase().includes('customer')) return 'bg-blue-100 text-blue-800';
    if (reason?.toLowerCase().includes('kitchen') || reason?.toLowerCase().includes('burned') || reason?.toLowerCase().includes('overcooked')) return 'bg-red-100 text-red-800';
    if (reason?.toLowerCase().includes('delivery')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Waste Data</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button 
            onClick={loadWasteData}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Waste Management</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadWasteData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Waste Items</h3>
            <p className="text-3xl font-bold text-red-600">{analytics.totalWastedItems}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Waste Value</h3>
            <p className="text-3xl font-bold text-red-600">R{analytics.totalWasteValue.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Average per Item</h3>
            <p className="text-3xl font-bold text-orange-600">R{analytics.averageWastePerItem.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Most Common Reason</h3>
            <p className="text-lg font-bold text-gray-800">
              {Object.keys(analytics.wasteByReason).length > 0 
                ? Object.entries(analytics.wasteByReason)
                    .sort((a, b) => b[1].count - a[1].count)[0][0]
                : 'N/A'
              }
            </p>
          </div>
        </div>
      )}

      {/* Waste by Reason */}
      {analytics && Object.keys(analytics.wasteByReason).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Waste by Reason</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.wasteByReason)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([reason, data]) => (
                <div key={reason} className="p-4 border rounded-lg">
                  <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(reason)}`}>
                    {reason}
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-semibold">{data.count} items</p>
                    <p className="text-sm text-gray-600">Value: R{data.value.toFixed(2)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Waste Items */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Waste Items</h2>
        </div>
        <div className="overflow-x-auto">
          {wastedOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No waste items found</p>
              <p className="text-sm mt-2">This is good news - no waste recorded for the selected period!</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wasted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wastedOrders.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.wasteTimestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.customerName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.wasteType === 'full_order' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.wasteType === 'full_order' ? 'Full Order' : 'Partial Pizzas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(item.wasteReason)}`}>
                        {item.wasteReason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      R{(item.wasteValue || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.wastedBy || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.wasteDetails || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasteManagementPage;