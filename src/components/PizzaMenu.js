// src/components/PizzaMenu.js
import React from 'react';

const PizzaMenu = ({ onOrderClick }) => {
  const menuItems = [
    {
      id: 'mish-mash',
      name: "Mish-Mash Pizza",
      price: 192.00,
      description: "Parma ham, fig preserve, goat's cheese and rocket, enough said!",
      ingredients: ["Parma ham", "Fig preserve", "Goat's cheese", "Rocket"]
    },
    {
      id: 'pig-paradise',
      name: "Pig in Paradise Pizza",
      price: 169.00,
      description: "This little piggy went to Hawaii. Sourdough, pizza sauce, cheese, bacon and caramelized pineapple.",
      ingredients: ["Bacon", "Caramelized pineapple", "Cheese", "Pizza sauce"]
    },
    // ... add all pizzas from the menu
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {menuItems.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <span className="text-green-600 font-medium">R{item.price.toFixed(2)}</span>
            </div>
            <p className="text-gray-600 mt-2">{item.description}</p>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Ingredients: {item.ingredients.join(', ')}
              </p>
            </div>
            <button
              onClick={() => onOrderClick(item)}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Order Now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PizzaMenu;