import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseService';

const SimpleOrderForm = ({ onClose }) => {
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [platform, setPlatform] = useState('Window');
  const [pizzaType, setPizzaType] = useState('Margie');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pizza options and prices
  const pizzaOptions = [
    'Margie', 'Champ', 'Pig n Paradise', 'Vegan Harvest', 'Mish-Mash', 
    'Mushroom Cloud', 'Spud', 'Lekker\'izza Pizza', 'Poppa\'s Pizza'
  ];

  const pizzaPrices = {
    'Margie': 149,
    'Champ': 179,
    'Pig n Paradise': 169,
    'Vegan Harvest': 189,
    'Mish-Mash': 192,
    'Mushroom Cloud': 174,
    'Spud': 149,
    'Lekker\'izza Pizza': 194,
    'Poppa\'s Pizza': 179
  };

  // Platform options
  const platformOptions = ['Window', 'Uber Eats', 'Mr D Food', 'Bolt Food', 'Customer Pickup', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Starting direct Firestore order submission');
      
      // Calculate price
      const price = pizzaPrices[pizzaType] * quantity;
      
      // Create order object
      const orderData = {
        customerName,
        platform,
        orderTime: new Date().toISOString(),
        totalAmount: price,
        prepTime: 15, // Default prep time
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        pizzas: [
          {
            pizzaType,
            quantity,
            totalPrice: price,
            specialInstructions,
            rowNumber: 1,
            isCooked: false
          }
        ],
        cooked: [false],
        orderId: `order-${Date.now()}`
      };

      // Get reference to the orders collection
      const ordersCollection = collection(db, 'orders');
      
      // Add document to Firestore
      const docRef = await addDoc(ordersCollection, orderData);
      console.log('Order created successfully with ID:', docRef.id);
      
      // Show success message
      setSuccess(true);
      
      // Reset form after 1.5 seconds
      setTimeout(() => {
        setCustomerName('');
        setPizzaType('Margie');
        setQuantity(1);
        setSpecialInstructions('');
        setSuccess(false);
        
        // Close form
        if (onClose) onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error creating order:', err);
      setError(`Failed to create order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create Simple Order</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">
          Order created successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Customer Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* Platform */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Delivery Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {platformOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        {/* Pizza Type */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Pizza Type
          </label>
          <select
            value={pizzaType}
            onChange={(e) => setPizzaType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pizzaOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Special Instructions */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>
        
        {/* Order Total */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <span className="font-bold">Total: </span>
          R{(pizzaPrices[pizzaType] * quantity).toFixed(2)}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleOrderForm;
