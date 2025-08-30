import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import useQueueCalculator from '../hooks/useQueueCalculator';

const NewSimpleOrderForm = ({ onClose }) => {
  const { calculateEstimatedPrepTime, formatTimeEstimate, totalPizzasInQueue } = useQueueCalculator();
  const [status, setStatus] = useState('idle');
  const [orderData, setOrderData] = useState({
    customerName: 'John Doe',
    pizzaType: 'Margie Pizza',
    quantity: 1,
    platform: 'Window',
    specialInstructions: '',
    prepTimeMinutes: 15
  });
  const [orderId, setOrderId] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add log message with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[SimpleOrderForm] ${message}`);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) : value
    }));
  };

  // Pizza menu from John Dough's
  const pizzaMenu = [
    { id: 'margie', name: 'Margie Pizza', price: 149.00 },
    { id: 'the-champ', name: 'The Champ Pizza', price: 179.00 },
    { id: 'pig-paradise', name: 'Pig in Paradise', price: 169.00 },
    { id: 'mushroom-cloud', name: 'Mushroom Cloud Pizza', price: 174.00 },
    { id: 'spud', name: 'Spud Pizza', price: 149.00 },
    { id: 'mish-mash', name: 'Mish-Mash Pizza', price: 192.00 },
    { id: 'lekkerizza', name: 'Lekker\'izza', price: 194.00 },
    { id: 'sunshine-margherita', name: 'Sunshine Margherita', price: 149.00 },
    { id: 'vegan-harvest', name: 'Vegan Harvest Pizza', price: 189.00 },
    { id: 'poppas', name: 'Poppa\'s Pizza', price: 179.00 },
    { id: 'zesty-zucchini', name: 'The Zesty Zucchini', price: 149.00 },
    { id: 'chick-tick-boom', name: 'Chick Tick Boom', price: 172.00 },
    { id: 'artichoke-ham', name: 'Artichoke & Ham', price: 172.00 },
    { id: 'janes-dough', name: 'Jane\'s Dough', price: 109.00 }
  ];
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      addLog('Creating order...');
      
      // Ensure db is available (it should be, as it's imported)
      if (!db) {
        addLog('Firestore instance (db) is not available. This should not happen.');
        setStatus('error');
        return;
      }
      addLog('Firestore instance (db) is available.');
      
      // Find selected pizza and get its price
      const selectedPizza = pizzaMenu.find(pizza => pizza.name === orderData.pizzaType) || { price: 149 };
      
      const price = selectedPizza.price * orderData.quantity;
      
      // Create order object
      const newOrder = {
        customerName: orderData.customerName,
        platform: orderData.platform,
        orderId: `order-${Date.now()}`,
        orderTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        totalAmount: price,
        prepTimeMinutes: orderData.prepTimeMinutes || 15,
        // Calculate due time based on current time + prep time minutes
        dueTime: new Date(Date.now() + (orderData.prepTimeMinutes * 60 * 1000)).toISOString(),
        pizzas: [
          {
            pizzaType: orderData.pizzaType,
            quantity: orderData.quantity,
            totalPrice: price,
            isCooked: false,
            rowNumber: 1,
            specialInstructions: orderData.specialInstructions || '' // Include special instructions
          }
        ],
        cooked: [false],
        hasSpecialInstructions: !!orderData.specialInstructions // Flag for special instructions
      };
      
      addLog(`Order object created: ${JSON.stringify(newOrder).slice(0, 100)}...`);
      
      // Add to Firestore using the EXACT SAME approach as the HTML test
      const docRef = await db.collection('orders').add(newOrder);
      
      addLog(`Order successfully added with ID: ${docRef.id}`);
      setOrderId(docRef.id);
      setStatus('success');
      
      // Close modal after success (delayed)
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
      
    } catch (error) {
      addLog(`Error creating order: ${error.message}`);
      console.error('Order creation error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-center">Quick Pizza Order</h2>
      
      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-800">
          <p className="font-bold">✅ Order Created Successfully!</p>
          <p className="text-sm">Order ID: {orderId}</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
          <p className="font-bold">❌ Error Creating Order</p>
          <p className="text-sm">See logs below for details</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            name="customerName"
            value={orderData.customerName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Pizza Type</label>
          <select
            name="pizzaType"
            value={orderData.pizzaType}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            {pizzaMenu.map(pizza => (
              <option key={pizza.id} value={pizza.name}>
                {pizza.name} (R{pizza.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={orderData.quantity}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Platform</label>
          <select
            name="platform"
            value={orderData.platform}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="Window">Window</option>
            <option value="Uber Eats">Uber Eats</option>
            <option value="Mr D Food">Mr D Food</option>
            <option value="Bolt Food">Bolt Food</option>
            <option value="Customer Pickup">Customer Pickup</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Prep Time (minutes)</label>
          <input
            type="number"
            name="prepTimeMinutes"
            value={orderData.prepTimeMinutes}
            onChange={handleChange}
            min="5"
            max="120"
            className="w-full p-2 border rounded"
            required
          />
          <p className="text-xs text-gray-500 mt-1">How many minutes needed to prepare this order</p>
          
          {/* Dynamic Queue Estimate Preview */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Queue Estimate Preview
            </div>
            <div className="text-sm text-blue-600">
              Current queue: <span className="font-semibold">{totalPizzasInQueue} pizzas</span>
            </div>
            <div className="text-sm text-blue-600">
              This order ready in: <span className="font-semibold">
                ~{formatTimeEstimate(calculateEstimatedPrepTime(orderData.quantity || 1))}
              </span>
            </div>
            <div className="text-xs text-blue-500 mt-1">
              * Estimate based on current kitchen workload
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Special Instructions</label>
          <textarea
            name="specialInstructions"
            value={orderData.specialInstructions}
            onChange={handleChange}
            placeholder="Extra cheese, no olives, etc."
            className="w-full p-2 border rounded h-20"
          />
        </div>
        
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {status === 'submitting' ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>
      
      <div className="mt-4 border-t pt-3">
        <h3 className="font-bold text-sm mb-1">Debug Logs:</h3>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono h-24 overflow-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </div>
      </div>
    </div>
  );
};

export default NewSimpleOrderForm;
