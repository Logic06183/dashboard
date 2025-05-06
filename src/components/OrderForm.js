/**
 * DEPRECATED: This component is no longer in use. 
 * Please use CustomOrderForm.js instead, which contains the latest features including:
 * - Delivery service selection (Window, Uber Eats, Mr D Food, etc.)
 * - Special pizza instructions functionality
 * - Enhanced UI for better usability
 */

import React, { useState, useEffect } from 'react';

const PIZZA_MENU = {
  'The Champ Pizza': { price: 179 },
  'Pig in Paradise': { price: 169 },
  'Margie Pizza': { price: 149 },
  'Mushroom Cloud Pizza': { price: 174 },
  'Spud Pizza': { price: 149 },
  'Mish-Mash Pizza': { price: 192 },
  'Lekker\'izza': { price: 194 },
  'Sunshine Margherita': { price: 149 },
  'Vegan Harvest Pizza': { price: 189 },
  'Poppa\'s Pizza': { price: 179 },
  'The Zesty Zucchini': { price: 149 },
  'Chick Tick Boom': { price: 172 },
  'Artichoke & Ham': { price: 172 },
  'Jane\'s Dough': { price: 109 }
};

const OrderForm = ({ onSubmit, setShowOrderForm }) => {
  const [pizzas, setPizzas] = useState([{
    pizzaType: '',
    quantity: 1,
    totalPrice: 0,
    specialInstructions: ''
  }]);
  const [customerName, setCustomerName] = useState('');
  const [platform, setPlatform] = useState('Window');
  const [customPlatform, setCustomPlatform] = useState('');
  const [prepTime, setPrepTime] = useState(15); // Default prep time in minutes
  const [dueTime, setDueTime] = useState('');
  
  // Platform/delivery service options
  const platformOptions = ['Window', 'Uber Eats', 'Mr D Food', 'Bolt Food', 'Customer Pickup', 'Other'];
  
  // Currently editing pizza for special instructions
  const [editingPizzaIndex, setEditingPizzaIndex] = useState(null);
  
  // Calculate default due time (current time + prep time)
  useEffect(() => {
    const now = new Date();
    const defaultDueTime = new Date(now.getTime() + prepTime * 60000);
    const hours = defaultDueTime.getHours().toString().padStart(2, '0');
    const minutes = defaultDueTime.getMinutes().toString().padStart(2, '0');
    setDueTime(`${hours}:${minutes}`);
  }, [prepTime]);

  const calculateTotal = () => {
    return pizzas.reduce((sum, pizza) => sum + (pizza.totalPrice || 0), 0);
  };

  const handlePizzaChange = (index, field, value) => {
    const newPizzas = [...pizzas];
    newPizzas[index] = {
      ...newPizzas[index],
      [field]: value
    };

    // Calculate total price for this pizza
    if (field === 'pizzaType' || field === 'quantity') {
      const price = PIZZA_MENU[newPizzas[index].pizzaType]?.price || 0;
      newPizzas[index].totalPrice = price * newPizzas[index].quantity;
    }

    setPizzas(newPizzas);
  };

  const addPizza = () => {
    setPizzas([...pizzas, { pizzaType: '', quantity: 1, totalPrice: 0, specialInstructions: '' }]);
  };
  
  // Open special instructions modal for a pizza
  const openInstructionsModal = (index) => {
    setEditingPizzaIndex(index);
  };
  
  // Close special instructions modal
  const closeInstructionsModal = () => {
    setEditingPizzaIndex(null);
  };
  
  // Save special instructions for a pizza
  const saveSpecialInstructions = (instructions) => {
    if (editingPizzaIndex === null) return;
    
    const newPizzas = [...pizzas];
    newPizzas[editingPizzaIndex] = {
      ...newPizzas[editingPizzaIndex],
      specialInstructions: instructions
    };
    
    setPizzas(newPizzas);
    closeInstructionsModal();
  };

  const removePizza = (index) => {
    if (pizzas.length === 1) return;
    const newPizzas = pizzas.filter((_, i) => i !== index);
    setPizzas(newPizzas);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate due time from input
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDate = new Date();
    dueDate.setHours(hours, minutes, 0, 0);
    
    // Get selected platform or custom platform if "Other" was selected
    const selectedPlatform = platform === 'Other' ? customPlatform : platform;
    
    // Prepare pizzas with special instructions
    const filteredPizzas = pizzas
      .filter(pizza => pizza.pizzaType && pizza.quantity > 0)
      .map(pizza => ({
        ...pizza,
        notes: pizza.specialInstructions || '' // For compatibility with existing code
      }));
    
    const order = {
      id: Date.now(),
      pizzas: filteredPizzas,
      status: 'pending',
      orderTime: new Date().toISOString(),
      dueTime: dueDate.toISOString(), // Add due time to order
      prepTime: prepTime, // Add prep time in minutes
      customerName: customerName.trim() || undefined,
      totalAmount: calculateTotal(),
      platform: selectedPlatform, // Add delivery service platform
      urgency: parseInt(prepTime) <= 15 ? 'high' : parseInt(prepTime) <= 30 ? 'medium' : 'low',
      cooked: pizzas.map(() => false) // Track cooking status for each pizza
    };

    onSubmit(order);
    setShowOrderForm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        {pizzas.map((pizza, index) => {
          const hasInstructions = pizza.specialInstructions && pizza.specialInstructions.length > 0;
          
          return (
            <div key={index} className="flex items-center space-x-4">
              <select
                value={pizza.pizzaType}
                onChange={(e) => handlePizzaChange(index, 'pizzaType', e.target.value)}
                className={`flex-1 rounded-md ${hasInstructions ? 'border-yellow-400' : 'border-gray-300'} bg-gray-100`}
                required
              >
                <option value="">Select Pizza</option>
                {Object.keys(PIZZA_MENU).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <input
                type="number"
                min="1"
                value={pizza.quantity}
                onChange={(e) => handlePizzaChange(index, 'quantity', parseInt(e.target.value) || 1)}
                className="w-20 rounded-md bg-gray-100 border-gray-300"
              />
              
              <div className="text-right w-24">
                R{pizza.totalPrice || 0}
              </div>
              
              {pizza.pizzaType && (
                <button
                  type="button"
                  onClick={() => openInstructionsModal(index)}
                  className={`text-blue-500 hover:text-blue-700 ${hasInstructions ? 'ring-1 ring-yellow-400 rounded-full p-1' : ''}`}
                  title={hasInstructions ? pizza.specialInstructions : "Add special instructions"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => removePizza(index)}
                className="text-red-500 hover:text-red-700"
                disabled={pizzas.length === 1}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-md bg-gray-100 border-gray-300"
              placeholder="Optional"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="platform" className="text-sm font-medium text-gray-700">Delivery Service</label>
            <div className="flex space-x-2">
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="flex-1 rounded-md bg-gray-100 border-gray-300"
                required
              >
                {platformOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              
              {platform === 'Other' && (
                <input
                  type="text"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  className="flex-1 rounded-md bg-gray-100 border-gray-300"
                  placeholder="Specify platform"
                  required
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="prepTime" className="text-sm font-medium text-gray-700">Preparation Time (minutes)</label>
            <input
              type="number"
              id="prepTime"
              min="1"
              max="180"
              step="1"
              value={prepTime}
              onChange={(e) => {
                const value = Math.max(1, Math.floor(Number(e.target.value) || 15));
                setPrepTime(value);
              }}
              className="rounded-md bg-gray-100 border-gray-300"
              required
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="dueTime" className="text-sm font-medium text-gray-700">Due Time</label>
            <input
              type="time"
              id="dueTime"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="rounded-md bg-gray-100 border-gray-300"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addPizza}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Add Pizza
        </button>
        <div className="text-xl font-bold">
          Total: R{calculateTotal()}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setShowOrderForm(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Place Order
        </button>
      </div>
      
      {/* Pizza Special Instructions Modal */}
      {editingPizzaIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">
              Special Instructions for {pizzas[editingPizzaIndex].pizzaType}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Special Instructions
              </label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded"
                rows="4"
                placeholder="e.g., No onions, extra cheese, half-and-half toppings, etc."
                defaultValue={pizzas[editingPizzaIndex].specialInstructions || ''}
                id="pizza-instructions"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Specify any special requests, additions, or removals for this pizza.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                onClick={closeInstructionsModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => saveSpecialInstructions(document.getElementById('pizza-instructions').value)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default OrderForm;