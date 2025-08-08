/**
 * CustomerMigrationTool.js
 * Tool for migrating existing order data to create customer records
 */

import React, { useState } from 'react';
import customerService from '../services/CustomerService';

const CustomerMigrationTool = ({ orders = [] }) => {
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, running, completed, error
  const [migrationResult, setMigrationResult] = useState(null);

  const runMigration = async () => {
    if (migrationStatus === 'running') return;

    setMigrationStatus('running');
    setMigrationResult(null);

    try {
      console.log('Starting customer migration with', orders.length, 'orders');
      const customersCreated = await customerService.migrateExistingCustomers(orders);
      
      setMigrationResult({
        success: true,
        customersCreated,
        ordersProcessed: orders.length
      });
      setMigrationStatus('completed');
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({
        success: false,
        error: error.message
      });
      setMigrationStatus('error');
    }
  };

  const resetMigration = () => {
    setMigrationStatus('idle');
    setMigrationResult(null);
  };

  // Analyze current data
  const customerNameAnalysis = React.useMemo(() => {
    if (!orders || orders.length === 0) return { unique: 0, total: 0, duplicates: [] };

    const nameMap = new Map();
    let totalWithNames = 0;

    orders.forEach(order => {
      if (order.customerName && order.customerName.trim()) {
        totalWithNames++;
        const name = order.customerName.trim().toLowerCase();
        nameMap.set(name, (nameMap.get(name) || 0) + 1);
      }
    });

    const duplicates = Array.from(nameMap.entries())
      .filter(([name, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      unique: nameMap.size,
      total: totalWithNames,
      duplicates: duplicates.map(([name, count]) => ({ name, count }))
    };
  }, [orders]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Customer Database Migration</h3>
      
      {/* Data Analysis */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Current Data Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-600 font-medium">Total Orders</p>
            <p className="text-xl font-bold text-blue-900">{orders.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-green-600 font-medium">Orders with Names</p>
            <p className="text-xl font-bold text-green-900">{customerNameAnalysis.total}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-sm text-yellow-600 font-medium">Unique Customer Names</p>
            <p className="text-xl font-bold text-yellow-900">{customerNameAnalysis.unique}</p>
          </div>
        </div>

        {customerNameAnalysis.duplicates.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium mb-2">Potential Duplicate Customers</h5>
            <div className="bg-gray-50 p-3 rounded">
              {customerNameAnalysis.duplicates.map((duplicate, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="capitalize">{duplicate.name}</span>
                  <span className="text-sm text-gray-600">{duplicate.count} orders</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Migration Controls */}
      <div className="border-t pt-4">
        {migrationStatus === 'idle' && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              This will create customer records from your existing orders. Customers will be identified 
              by phone number when available, or by name. This process is safe and won't modify existing orders.
            </p>
            <button
              onClick={runMigration}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🚀 Start Customer Migration
            </button>
          </div>
        )}

        {migrationStatus === 'running' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Migrating customer data... This may take a few moments.</p>
          </div>
        )}

        {migrationStatus === 'completed' && migrationResult && (
          <div className="bg-green-100 border border-green-300 rounded p-4">
            <h4 className="font-medium text-green-800 mb-2">✅ Migration Completed Successfully!</h4>
            <p className="text-green-700 mb-2">
              Created {migrationResult.customersCreated} customer records from {migrationResult.ordersProcessed} orders.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={resetMigration}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {migrationStatus === 'error' && migrationResult && (
          <div className="bg-red-100 border border-red-300 rounded p-4">
            <h4 className="font-medium text-red-800 mb-2">❌ Migration Failed</h4>
            <p className="text-red-700 mb-2">
              {migrationResult.error}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={resetMigration}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-800 mb-2">💡 What this does:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Creates customer records from existing order data</li>
          <li>• Uses phone numbers as primary identifiers to prevent duplicates</li>
          <li>• Calculates customer statistics (total orders, spending, preferences)</li>
          <li>• Assigns customer categories (New, Regular, Frequent, VIP)</li>
          <li>• Enables better customer tracking for future orders</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerMigrationTool;