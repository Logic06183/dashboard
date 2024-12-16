// src/components/OrderForm.js
import React, { useState } from 'react';

const PIZZA_MENU = {
  'Mish-Mash Pizza': {
    price: 192.00,
    description: "Parma ham, fig preserve, goat's cheese and rocket, enough said!",
    ingredients: ["Parma ham", "Fig preserve", "Goat's cheese", "Rocket"]
  },
  'Pig in Paradise Pizza': {
    price: 169.00,
    description: "This little piggy went to Hawaii. Sourdough, pizza sauce, cheese, bacon and caramelized pineapple.",
    ingredients: ["Bacon", "Caramelized pineapple", "Cheese", "Pizza sauce"]
  },
  'Margie Pizza': {
    price: 149.00,
    description: "John Dough's Margarita made with a sourdough base, pizza sauce, fresh mozzarella & basil. Simply delicious!",
    ingredients: ["Fresh mozzarella", "Basil", "Pizza sauce"],
    isVegetarian: true
  },
  'The Champ Pizza': {
    price: 179.00,
    description: "Pepperoni is the most popular ingredient on a pizza, worldwide. We love it! Simply done with spring onions and parmesan to champion the pepperoni.",
    ingredients: ["Pepperoni", "Spring onions", "Parmesan"]
  },
  'Vegan Harvest Pizza': {
    price: 189.00,
    description: "A delectable combination of tangy sourdough crust topped with a medley of earthy mushrooms, tender baby marrow, Kalamata olives, zesty sundried tomatoes, and fragrant seasonal fresh herbs.",
    ingredients: ["Mushrooms", "Baby marrow", "Kalamata olives", "Sundried tomatoes", "Fresh herbs", "Hummus"],
    isVegetarian: true
  }
};

const OrderForm = ({ onSubmit }) => {
  const [orderData, setOrderData] = useState({
    customerName: '',
    phone: '',
    pizzaType: '',
    extraToppings: [],
    address: '',
    notes: '',
    size: 'medium',
    dueTime: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedPizza = PIZZA_MENU[orderData.pizzaType];
    const basePrice = selectedPizza ? selectedPizza.price : 0;
    const extraToppingsPrice = orderData.extraToppings.length * 15; // R15 per extra topping

    const finalPrice = basePrice + extraToppingsPrice;

    onSubmit({
      ...orderData,
      dueTime: orderData.dueTime,
      orderTime: new Date(),
      status: 'pending',
      orderId: Math.random().toString(36).substr(2, 9),
      price: finalPrice
    });

    setOrderData({
      customerName: '',
      phone: '',
      pizzaType: '',
      extraToppings: [],
      address: '',
      notes: '',
      size: 'medium',
      dueTime: ''
    });
  };

  const extraToppingsOptions = [
    'Extra cheese', 'Mushrooms', 'Olives', 'Pepperoni', 'Bacon', 'Anchovies',
    'Feta', 'Parmesan', 'Fresh herbs', 'Caramelized onions'
  ];

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
          <label className="block text-sm font-medium text-gray-700">Pizza Selection</label>
          <select
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.pizzaType}
            onChange={(e) => setOrderData({...orderData, pizzaType: e.target.value})}
          >
            <option value="">Select a pizza</option>
            {Object.entries(PIZZA_MENU).map(([name, details]) => (
              <option key={name} value={name}>
                {name} - R{details.price.toFixed(2)} {details.isVegetarian ? '(Vegetarian)' : ''}
              </option>
            ))}
          </select>
          {orderData.pizzaType && (
            <p className="mt-2 text-sm text-gray-500">
              {PIZZA_MENU[orderData.pizzaType].description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Size</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.size}
            onChange={(e) => setOrderData({...orderData, size: e.target.value})}
          >
            <option value="small">Small (-R20)</option>
            <option value="medium">Medium</option>
            <option value="large">Large (+R30)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Extra Toppings (R15 each)</label>
          <div className="grid grid-cols-2 gap-2">
            {extraToppingsOptions.map(topping => (
              <label key={topping} className="flex items-center">
                <input
                  type="checkbox"
                  checked={orderData.extraToppings.includes(topping)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOrderData({
                        ...orderData,
                        extraToppings: [...orderData.extraToppings, topping]
                      });
                    } else {
                      setOrderData({
                        ...orderData,
                        extraToppings: orderData.extraToppings.filter(t => t !== topping)
                      });
                    }
                  }}
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

        <div>
          <label className="block text-sm font-medium text-gray-700">Due Time</label>
          <input
            type="datetime-local"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={orderData.dueTime}
            onChange={(e) => setOrderData({ ...orderData, dueTime: e.target.value })}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-700">Order Summary</h3>
          {orderData.pizzaType && (
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Pizza: {orderData.pizzaType} - R{PIZZA_MENU[orderData.pizzaType].price.toFixed(2)}</p>
              <p>Size: {orderData.size}</p>
              {orderData.extraToppings.length > 0 && (
                <p>Extra Toppings: {orderData.extraToppings.join(', ')} (R{orderData.extraToppings.length * 15})</p>
              )}
              <p className="font-medium">
                Total: R{(PIZZA_MENU[orderData.pizzaType]?.price + (orderData.extraToppings.length * 15)).toFixed(2)}
              </p>
            </div>
          )}
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