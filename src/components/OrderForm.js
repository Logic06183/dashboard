import React, { useState } from 'react';

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
    
    const order = {
      id: Date.now(),
      pizzas: pizzas.filter(pizza => pizza.pizzaType && pizza.quantity > 0),
      status: 'pending',
      orderTime: new Date().toISOString(),
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