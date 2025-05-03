import React, { useState } from 'react';

const CustomOrderForm = ({ onSubmit, setShowOrderForm }) => {
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [extraToppings, setExtraToppings] = useState('');
  
  // Initialize pizza order grid with 6 rows (2 sections of 3 rows each)
  const [pizzaGrid, setPizzaGrid] = useState([
    Array(19).fill(0), // Row 1
    Array(19).fill(0), // Row 2
    Array(19).fill(0), // Row 3
    Array(19).fill(0), // Row 4
    Array(19).fill(0), // Row 5
    Array(19).fill(0), // Row 6
  ]);

  // Pizza menu options
  const pizzaOptions = [
    'Margie', 'Champ', 'Pig n Paradise', 'Vegan Harvest', 'Mish-Mash', 
    'Mushroom Cloud', 'Feisty Italian', 'Sausage Party', 'Zesty Zucchini', 
    'Spud', 'Owen', 'Build Your Own', 'Lekker\'izza Pizza', 'Poppa\'s Pizza', 
    'Sunshine Margherita', 'Chick Tick Boom', 'Ham & Artichoke', 'Veg Special', 'Jane\'s Dough'
  ];

  // Platform options
  const platformOptions = ['Uber', 'Mr Delivery', 'Bolt', 'Window', 'Other'];

  // Pizza prices (in Rands)
  const pizzaPrices = {
    'Margie': 149,
    'Champ': 179,
    'Pig n Paradise': 169,
    'Vegan Harvest': 189,
    'Mish-Mash': 192,
    'Mushroom Cloud': 174,
    'Feisty Italian': 179,
    'Sausage Party': 179,
    'Zesty Zucchini': 149,
    'Spud': 149,
    'Owen': 169,
    'Build Your Own': 159,
    'Lekker\'izza Pizza': 194,
    'Poppa\'s Pizza': 179,
    'Sunshine Margherita': 149,
    'Chick Tick Boom': 172,
    'Ham & Artichoke': 172,
    'Veg Special': 169,
    'Jane\'s Dough': 109
  };

  // Handle pizza quantity change
  const handlePizzaChange = (rowIndex, colIndex, value) => {
    const newGrid = [...pizzaGrid];
    newGrid[rowIndex][colIndex] = parseInt(value) || 0;
    setPizzaGrid(newGrid);
  };

  // Calculate total order amount
  const calculateTotal = () => {
    let total = 0;
    
    // Calculate pizza costs
    for (let row = 0; row < pizzaGrid.length; row++) {
      for (let col = 0; col < pizzaGrid[row].length; col++) {
        const quantity = pizzaGrid[row][col];
        if (quantity > 0) {
          const pizzaType = pizzaOptions[col];
          const price = pizzaPrices[pizzaType] || 0;
          total += price * quantity;
        }
      }
    }
    
    return total;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Collect all ordered pizzas
    const orderedPizzas = [];
    for (let row = 0; row < pizzaGrid.length; row++) {
      for (let col = 0; col < pizzaGrid[row].length; col++) {
        const quantity = pizzaGrid[row][col];
        if (quantity > 0) {
          const pizzaType = pizzaOptions[col];
          const price = pizzaPrices[pizzaType] || 0;
          
          orderedPizzas.push({
            pizzaType,
            quantity,
            totalPrice: price * quantity,
            rowNumber: row + 1
          });
        }
      }
    }
    
    // Create order object
    const order = {
      id: Date.now(),
      pizzas: orderedPizzas,
      status: 'pending',
      orderTime: new Date().toISOString(),
      totalAmount: calculateTotal(),
      platform: platform === 'Other' ? customPlatform : platform,
      customerName,
      prepTime: parseInt(prepTime) || 15,
      extraToppings,
      urgency: parseInt(prepTime) <= 15 ? 'high' : parseInt(prepTime) <= 30 ? 'medium' : 'low'
    };
    
    // Submit order
    onSubmit(order);
    setShowOrderForm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto" style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', backgroundColor: '#f0f0f0', borderTop: '10px solid #673ab7' }}>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-normal text-center text-gray-800 border-b pb-4 mb-6" style={{ color: '#202124', fontWeight: '400' }}>Input Order Form</h2>
        
        {/* Customer Name Field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="Enter customer name"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-4" style={{ color: '#5f6368' }}>
          Platform
        </label>
        <div className="flex flex-col space-y-2">
          {platformOptions.map((option) => (
            <div key={option} className="flex items-center">
              <input
                type="radio"
                id={option}
                name="platform"
                value={option}
                checked={platform === option}
                onChange={() => setPlatform(option)}
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500"
                style={{ accentColor: '#673ab7' }}
              />
              <label htmlFor={option} className="text-gray-700">{option}</label>
            </div>
          ))}
        </div>
        
        {/* Custom Platform Input */}
        {platform === 'Other' && (
          <input
            type="text"
            value={customPlatform}
            onChange={(e) => setCustomPlatform(e.target.value)}
            className="mt-4 w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="Enter platform name"
            style={{ backgroundColor: 'transparent' }}
          />
        )}
      </div>
      
      {/* Pizza Order Grid */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-4" style={{ color: '#5f6368' }}>
          Pizzas
        </label>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b w-24 text-left text-sm font-medium text-gray-600" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>Row</th>
                {pizzaOptions.map((pizza, index) => (
                  <th key={index} className="py-3 px-2 border-b text-xs text-left font-medium text-gray-600" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>
                    {pizza}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pizzaGrid.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 border-b font-medium text-gray-700">
                    {rowIndex < 3 ? `Row ${rowIndex + 1}` : `Row ${rowIndex - 2}`}
                  </td>
                  {row.map((quantity, colIndex) => (
                    <td key={colIndex} className="py-2 px-1 border-b">
                      <input
                        type="number"
                        min="0"
                        value={quantity || ''}
                        onChange={(e) => handlePizzaChange(rowIndex, colIndex, e.target.value)}
                        className="w-full p-1 text-center border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                        style={{ height: '32px' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Extra Toppings */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
          Extra Toppings
        </label>
        <textarea
          value={extraToppings}
          onChange={(e) => setExtraToppings(e.target.value)}
          className="w-full py-2 px-3 text-gray-700 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
          rows="3"
          placeholder="Enter any extra toppings or special instructions"
        />
      </div>
      
      {/* Preparation Time */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
          Preparation time
        </label>
        <input
          type="number"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          className="w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="Enter preparation time in minutes (e.g., 15)"
          min="1"
          style={{ backgroundColor: 'transparent' }}
        />
        <p className="text-xs text-gray-500 mt-1">Enter preparation time in minutes (e.g., 15)</p>
      </div>
      
      {/* Google Forms-like footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Never submit passwords through this form.</p>
        <p className="mt-2">This content is neither created nor endorsed by Google.</p>
      </div>
      
      {/* Order Summary */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-lg mb-2 text-purple-800">Order Summary</h3>
        <p className="text-xl font-medium text-purple-700">Total: R{calculateTotal().toFixed(2)}</p>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setShowOrderForm(false)}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium"
          style={{ backgroundColor: '#673ab7' }}
        >
          Submit
        </button>
      </div>
    </div>
    </form>
  );
};

export default CustomOrderForm;
