import React, { useState } from 'react';
import customerService from '../services/CustomerService';

const TestCustomerData = ({ onClose }) => {
  const [status, setStatus] = useState('');
  const [customers, setCustomers] = useState([]);

  // Test creating sample customers
  const createSampleCustomers = async () => {
    setStatus('Creating sample customers...');
    
    const sampleCustomers = [
      { name: 'John Smith', phone: '0821234567', email: 'john@example.com' },
      { name: 'Sarah Johnson', phone: '0831234567', email: 'sarah@example.com' },
      { name: 'Mike Williams', phone: '0841234567', email: 'mike@example.com' },
      { name: 'Emma Davis', phone: '0851234567', email: 'emma@example.com' },
      { name: 'Chris Brown', phone: '0861234567', email: 'chris@example.com' }
    ];

    try {
      for (const customer of sampleCustomers) {
        await customerService.createCustomer(customer);
        console.log(`Created customer: ${customer.name}`);
      }
      setStatus('Sample customers created successfully!');
      await testSearchCustomers();
    } catch (error) {
      setStatus(`Error creating customers: ${error.message}`);
    }
  };

  // Test searching for customers
  const testSearchCustomers = async () => {
    setStatus('Testing customer search...');
    
    try {
      // Test searching by name
      const results = await customerService.searchCustomers('John');
      console.log('Search results for "John":', results);
      setCustomers(results);
      
      if (results.length > 0) {
        setStatus(`Found ${results.length} customer(s) matching "John"`);
      } else {
        setStatus('No customers found. You may need to create some first.');
      }
    } catch (error) {
      setStatus(`Error searching customers: ${error.message}`);
    }
  };

  // Test getting all customers
  const getAllCustomers = async () => {
    setStatus('Fetching all customers...');
    
    try {
      const allCustomers = await customerService.getAllCustomers();
      console.log('All customers:', allCustomers);
      setCustomers(allCustomers);
      setStatus(`Found ${allCustomers.length} total customer(s)`);
    } catch (error) {
      setStatus(`Error getting customers: ${error.message}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Customer Database Test</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={createSampleCustomers}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Sample Customers
          </button>
          <button
            onClick={testSearchCustomers}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Search
          </button>
          <button
            onClick={getAllCustomers}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Get All Customers
          </button>
        </div>

        {status && (
          <div className={`p-3 rounded ${
            status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {status}
          </div>
        )}

        {customers.length > 0 && (
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Customer Results:</h3>
            <div className="space-y-2">
              {customers.map((customer, index) => (
                <div key={customer.id || index} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">
                    Phone: {customer.phone || 'N/A'} | 
                    Category: {customer.category || 'N/A'} |
                    Orders: {customer.totalOrders || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCustomerData;