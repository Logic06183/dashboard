// src/components/OrderForm.js
import React, { useState } from 'react';

const OrderForm = ({ onSubmit }) => {
  const [orderData, setOrderData] = useState({
    customerName: '',
    phone: '',
    size: 'medium',
    toppings: [],
    address: '',
    notes: ''
  });

  const toppingOptions = [
    'Pepperoni', 'Mushrooms', 'Onions', 'Sausage', 
    'Bell Peppers', 'Extra Cheese', 'Olives'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...orderData,
      orderTime: new Date(),
      status: 'pending',
      orderId: Math.random().toString(36).substr(2, 9)
    });
    setOrderData({
      customerName: '',
      phone: '',
      size: 'medium',
      toppings: [],
      address: '',
      notes: ''
    });
  };

  const handleToppingChange = (topping) => {
    setOrderData(prev => ({
      ...prev,
      toppings: prev.toppings.includes(topping)
        ? prev.toppings.filter(t => t !== topping)
        : [...prev.toppings, topping]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Place Pizza Order</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer Name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.customerName}
            onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.phone}
            onChange={(e) => setOrderData({...orderData, phone: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.size}
            onChange={(e) => setOrderData({...orderData, size: e.target.value})}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Toppings</label>
          <div className="grid grid-cols-2 gap-2">
            {toppingOptions.map(topping => (
              <label key={topping} className="flex items-center">
                <input
                  type="checkbox"
                  checked={orderData.toppings.includes(topping)}
                  onChange={() => handleToppingChange(topping)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{topping}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
          <textarea
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="3"
            value={orderData.address}
            onChange={(e) => setOrderData({...orderData, address: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="2"
            value={orderData.notes}
            onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Place Order
        </button>
      </div>
    </form>
  );
};

export default OrderForm;