// src/components/PizzaMenu.js
import React from 'react';

const PizzaMenu = ({ onOrderClick }) => {
  // Confirmed price list from John Dough's management (April 2026)
  const menuItems = [
    // Non-pizza items
    {
      id: 'janes-dough',
      name: "JANE'S DOUGH",
      price: 89.00,
      description: "Six freshly baked sourdough balls, served with garlic butter.",
      ingredients: ["Sourdough", "Garlic butter"]
    },
    {
      id: 'dough-balls',
      name: "DOUGH BALLS",
      price: 89.00,
      description: "Six freshly baked sourdough balls, served with garlic butter.",
      ingredients: ["Sourdough", "Garlic butter"]
    },
    {
      id: 'braaibroodjie',
      name: "BRAAIBROODJIE PIZZA",
      price: 100.00,
      description: "A South African classic reimagined as a pizza.",
      ingredients: ["Sourdough base", "Tomato sauce", "Cheese"]
    },
    // Pizza items — sorted by price
    {
      id: 'owen',
      name: "OWEN!",
      price: 99.00,
      description: "For little pizza lovers! Sauce and lots of shredded cheese on our sourdough rolled base that's good for the gut.",
      ingredients: ["Pizza sauce", "Shredded cheese", "Sourdough base"]
    },
    {
      id: 'margie',
      name: "MARGIE",
      price: 119.00,
      description: "The original Neapolitan classic with fresh mozzarella and fragrant basil.",
      ingredients: ["Fresh mozzarella", "Fragrant basil", "Tomato sauce"]
    },
    {
      id: 'caprese',
      name: "CAPRESE",
      price: 129.00,
      description: "Fresh mozzarella, vibrant tomatoes, balsamic glaze and basil pesto on our signature crust.",
      ingredients: ["Fresh mozzarella", "Vibrant tomatoes", "Balsamic glaze", "Basil pesto"]
    },
    {
      id: 'spud',
      name: "SPUD",
      price: 129.00,
      description: "A white pizza with a heart-warming hug of crispy potatoes, caramelised onion, fragrant rosemary, a kiss of chilli oil, and a dusting of Parmesan",
      ingredients: ["Crispy potatoes", "Caramelised onion", "Rosemary", "Chilli oil", "Parmesan"]
    },
    {
      id: 'chick-tick-boom',
      name: "CHICK TICK BOOM!",
      price: 149.00,
      description: "Spicy chicken tikka, sweet peppadews, and a burst of fresh coriander dance on a delicious crust.",
      ingredients: ["Spicy chicken tikka", "Sweet peppadews", "Fresh coriander"]
    },
    {
      id: 'glaze-of-glory',
      name: "GLAZE OF GLORY",
      price: 149.00,
      description: "Balsamic glaze drizzled over bacon, feta and red onion. You stay classy, Joburg.",
      ingredients: ["Bacon", "Feta", "Red onion", "Balsamic glaze"]
    },
    {
      id: 'pig-in-paradise',
      name: "PIG IN PARADISE",
      price: 149.00,
      description: "Sourdough piled high with cheese, bacon, and caramelised pineapple. We're not saying it's a Hawaiian pizza, but...",
      ingredients: ["Cheese", "Bacon", "Caramelised pineapple", "Sourdough base"]
    },
    {
      id: 'artichoke-ham',
      name: "ARTICHOKE & HAM",
      price: 155.00,
      description: "Shredded mozzarella, ham, mushrooms, artichoke & olives. A taste sensation, or just dinner, depending on your standards.",
      ingredients: ["Shredded mozzarella", "Ham", "Mushrooms", "Artichoke", "Olives"]
    },
    {
      id: 'quattro-formaggi',
      name: "QUATTRO FORMAGGI",
      price: 155.00,
      description: "A four-cheese feast of shredded mozzarella, provolone, blue cheese, and Parmesan, plus red onion and fig jam. Great pizza, questionable date choice.",
      ingredients: ["Shredded mozzarella", "Provolone", "Blue cheese", "Parmesan", "Red onion", "Fig jam"]
    },
    {
      id: 'mediterranean',
      name: "MEDITERRANEAN",
      price: 159.00,
      description: "Earthy mushrooms, zucchini, olives, sun-dried tomatoes, herbs, hummus, olive oil. (Cheese? Never heard of it.)",
      ingredients: ["Mushrooms", "Zucchini", "Olives", "Sun-dried tomatoes", "Herbs", "Hummus", "Olive oil"]
    },
    {
      id: 'mushroom-cloud',
      name: "MUSHROOM CLOUD",
      price: 159.00,
      description: "Farm-fresh mushrooms, caramelised onions, goat cheese, Banhoek chilli oil and a sprinkle of sunflower seeds.",
      ingredients: ["Farm-fresh mushrooms", "Caramelised onions", "Goat cheese", "Banhoek chilli oil", "Sunflower seeds"]
    },
    {
      id: 'poppas',
      name: "POPPA'S",
      price: 159.00,
      description: "Bacon, pepperoni, biltong, peppadews, shredded mozzarella, red onion, Mrs Ball's Chutney and feta.",
      ingredients: ["Bacon", "Pepperoni", "Biltong", "Peppadews", "Shredded mozzarella", "Red onion", "Mrs Ball's Chutney", "Feta"]
    },
    {
      id: 'the-champ',
      name: "THE CHAMP",
      price: 159.00,
      description: "Pepperoni, sourdough, red onion, parmesan and victory.",
      ingredients: ["Pepperoni", "Sourdough", "Red onion", "Parmesan"]
    },
    {
      id: 'vegan-harvest',
      name: "VEGAN HARVEST",
      price: 165.00,
      description: "Plant based feast with assorted vegetables, herbs and vegan cheese",
      ingredients: ["Mushrooms", "Zucchini", "Olives", "Sun-dried tomatoes", "Herbs", "Hummus", "Olive oil"]
    },
    {
      id: 'mish-mash',
      name: "MISH-MASH",
      price: 169.00,
      description: "Parma ham, fig jam, oh damn! Finished with goat's cheese and rocket.",
      ingredients: ["Parma ham", "Fig jam", "Goat's cheese", "Rocket"]
    },
    {
      id: 'lekkerizza',
      name: "LEKKER'IZZA",
      price: 185.00,
      description: "Bacon, pepperoni, biltong, peppadews, feta, red onion, chutney — the works.",
      ingredients: ["Bacon", "Pepperoni", "Biltong", "Peppadews", "Feta", "Red onion", "Chutney"]
    }
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
              className="mt-4 w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700"
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