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
    totalPrice: 0
  }]);
  const [customerName, setCustomerName] = useState('');
  const [prepTime, setPrepTime] = useState(15); // Default prep time in minutes
  const [dueTime, setDueTime] = useState('');
  
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
    setPizzas([...pizzas, { pizzaType: '', quantity: 1, totalPrice: 0 }]);
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
    
    const order = {
      id: Date.now(),
      pizzas: pizzas.filter(pizza => pizza.pizzaType && pizza.quantity > 0),
      status: 'pending',
      orderTime: new Date().toISOString(),
      dueTime: dueDate.toISOString(), // Add due time to order
      prepTime: prepTime, // Add prep time in minutes
      customerName: customerName.trim() || undefined,
      totalAmount: calculateTotal(),
      cooked: pizzas.map(() => false) // Track cooking status for each pizza
    };

    onSubmit(order);
    setShowOrderForm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        {pizzas.map((pizza, index) => (
          <div key={index} className="flex items-center space-x-4">
            <select
              value={pizza.pizzaType}
              onChange={(e) => handlePizzaChange(index, 'pizzaType', e.target.value)}
              className="flex-1 rounded-md bg-gray-100 border-gray-300"
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

            <button
              type="button"
              onClick={() => removePizza(index)}
              className="text-red-500 hover:text-red-700"
              disabled={pizzas.length === 1}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="prepTime" className="text-sm font-medium text-gray-700">Preparation Time (minutes)</label>
            <select
              id="prepTime"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="rounded-md bg-gray-100 border-gray-300"
            >
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
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
    </form>
  );
};

export default OrderForm;