/**
 * CustomerSelector.js
 * Autocomplete customer selection component with quick-add functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import customerService from '../services/CustomerService';

const CustomerSelector = ({ 
  selectedCustomer, 
  onCustomerSelect, 
  placeholder = "Enter customer name or phone...",
  required = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Initialize input value from selected customer
  useEffect(() => {
    if (selectedCustomer) {
      setInputValue(selectedCustomer.name || '');
    } else {
      setInputValue('');
    }
  }, [selectedCustomer]);

  // Search customers with debouncing
  const searchCustomers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await customerService.searchCustomers(searchTerm);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear current selection if input changes
    if (selectedCustomer && value !== selectedCustomer.name) {
      onCustomerSelect(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCustomers(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (customer) => {
    setInputValue(customer.name);
    setShowSuggestions(false);
    onCustomerSelect(customer);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (inputValue.length >= 2) {
      searchCustomers(inputValue);
    }
  };

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && !showSuggestions && inputValue.length > 0) {
      e.preventDefault();
      handleCreateNewCustomer();
    }
  };

  // Show new customer form
  const handleCreateNewCustomer = () => {
    setNewCustomerData({
      name: inputValue,
      phone: '',
      email: ''
    });
    setShowNewCustomerForm(true);
    setShowSuggestions(false);
  };

  // Handle new customer form changes
  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomerData.name.trim()) {
      alert('Customer name is required');
      return;
    }

    setIsLoading(true);
    try {
      const newCustomer = await customerService.createCustomer(newCustomerData);
      setInputValue(newCustomer.name);
      setShowNewCustomerForm(false);
      onCustomerSelect(newCustomer);
      
      // Reset form
      setNewCustomerData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel new customer creation
  const handleCancelNewCustomer = () => {
    setShowNewCustomerForm(false);
    setNewCustomerData({ name: '', phone: '', email: '' });
  };

  // Format customer display
  const formatCustomerDisplay = (customer) => {
    const parts = [customer.name];
    if (customer.phone) {
      parts.push(`(${customer.phone})`);
    }
    if (customer.category && customer.category !== 'New') {
      parts.push(`[${customer.category}]`);
    }
    return parts.join(' ');
  };

  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'VIP': 'bg-purple-100 text-purple-700',
      'Frequent': 'bg-green-100 text-green-700',
      'Regular': 'bg-blue-100 text-blue-700',
      'New': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors['New'];
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            selectedCustomer ? 'bg-green-50 border-green-300' : ''
          }`}
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Selected customer indicator */}
        {selectedCustomer && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <span className="text-green-500 text-sm">✓</span>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((customer, index) => (
                <div
                  key={customer.id || index}
                  onClick={() => handleSuggestionClick(customer)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {customer.totalOrders || 0} orders • R{(customer.totalSpent || 0).toFixed(0)} total
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(customer.category)}`}>
                      {customer.category || 'New'}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Add new customer option */}
              <div
                onClick={handleCreateNewCustomer}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200 text-blue-600 font-medium"
              >
                + Add "{inputValue}" as new customer
              </div>
            </>
          ) : (
            <div className="px-3 py-2 text-gray-500">
              No customers found. Press Enter to add new customer.
            </div>
          )}
        </div>
      )}

      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCustomerData.name}
                  onChange={handleNewCustomerChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomerData.phone}
                  onChange={handleNewCustomerChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 078 123 4567"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phone number helps us identify returning customers
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCustomerData.email}
                  onChange={handleNewCustomerChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Customer'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelNewCustomer}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Helper Text */}
      {!selectedCustomer && inputValue.length === 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Start typing to search for existing customers or create new ones
        </p>
      )}
      
      {selectedCustomer && (
        <p className="text-xs text-green-600 mt-1">
          Selected: {selectedCustomer.name} 
          {selectedCustomer.category && ` (${selectedCustomer.category} Customer)`}
        </p>
      )}
    </div>
  );
};

export default CustomerSelector;