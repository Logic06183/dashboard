// src/components/PizzaMenu.js
import React from 'react';

const PizzaMenu = ({ onOrderClick }) => {
  const menuItems = [
    {
      id: 'the-champ',
      name: "The Champ Pizza",
      price: 179.00,
      description: "Pepperoni is the most popular ingredient on pizza, worldwide. We love it! Simply done with spring onions and parmesan to champion the pepperoni.",
      ingredients: ["Pepperoni", "Spring onions", "Parmesan", "Mozzarella"],
      rating: "92% (420)"
    },
    {
      id: 'pig-paradise',
      name: "Pig in Paradise",
      price: 169.00,
      description: "This little piggy went to Hawaii. Sourdough, sauce, cheese, bacon and caramelised pineapple.",
      ingredients: ["Bacon", "Caramelised pineapple", "Cheese", "Pizza sauce"],
      rating: "96% (321)"
    },
    {
      id: 'margie',
      name: "Margie Pizza",
      price: 149.00,
      description: "John Dough's Margherita made with a sourdough base, tomato pizza sauce, fresh mozzarella & basil. Simply delicious!",
      ingredients: ["Tomato sauce", "Fresh mozzarella", "Basil", "Sourdough base"],
      rating: "91% (391)"
    },
    {
      id: 'mushroom-cloud',
      name: "Mushroom Cloud Pizza",
      price: 174.00,
      description: "A troop of mushrooms amongst clouds of goat's cheese, showered in sunflower seeds and sprinkled with chilli-infused olive oil. We also add garlic and caramelised onions for good measure.",
      ingredients: ["Mushrooms", "Goat's cheese", "Sunflower seeds", "Chilli-infused olive oil", "Garlic", "Caramelised onions"],
      rating: "98% (180)"
    },
    {
      id: 'spud',
      name: "Spud Pizza",
      price: 149.00,
      description: "A crispy potato topping on a sourdough pizza base with rosemary, salt flakes, caramelised onion and finished off with chilli oil and parmesan. The only thing better than sourdough, is potato slices on sourdough.",
      ingredients: ["Potato", "Rosemary", "Salt flakes", "Caramelised onion", "Chilli oil", "Parmesan"],
      rating: "93% (124)"
    },
    {
      id: 'mish-mash',
      name: "Mish-Mash Pizza",
      price: 192.00,
      description: "Parma ham, fig preserve, goat's cheese & rocket, enough said.",
      ingredients: ["Parma ham", "Fig preserve", "Goat's cheese", "Rocket"],
      rating: "97% (172)"
    },
    {
      id: 'lekkerizza',
      name: "Lekker'izza",
      price: 194.00,
      description: "Bacon, chorizo sausage, peppadews, feta and fresh herbs.",
      ingredients: ["Bacon", "Chorizo sausage", "Peppadews", "Feta", "Fresh herbs"],
      rating: "96% (89)"
    },
    {
      id: 'sunshine-margherita',
      name: "Sunshine Margherita",
      price: 149.00,
      description: "A basil pesto sauce topped with ricotta cheese, sundried tomatoes and fresh basil. Pizza Bianca (no sauce).",
      ingredients: ["Basil pesto", "Ricotta cheese", "Sundried tomatoes", "Fresh basil"],
      rating: "78% (41)"
    },
    {
      id: 'vegan-harvest',
      name: "Vegan Harvest Pizza",
      price: 189.00,
      description: "A delectable combination of tangy sourdough crust topped with a medley of earthy mushrooms, tender baby marrow, Kalamata olives, zesty sundried tomatoes, and fragrant seasonal fresh herbs. Finished with a creamy dollop of hummus and a drizzle of rich olive oil. A vegan delight!",
      ingredients: ["Mushrooms", "Baby marrow", "Kalamata olives", "Sundried tomatoes", "Seasonal herbs", "Hummus", "Olive oil"],
      rating: "96% (60)"
    },
    {
      id: 'poppas',
      name: "Poppa's Pizza",
      price: 179.00,
      description: "Love it - anchovies, olives, fresh mozzarella and basil.",
      ingredients: ["Anchovies", "Olives", "Fresh mozzarella", "Basil"],
      rating: "91% (71)"
    },
    {
      id: 'zesty-zucchini',
      name: "The Zesty Zucchini",
      price: 149.00,
      description: "A Pizza Bianca (no pizza sauce) showcasing the star ingredient of courgette, with tangy blue cheese adding zest and flavor, and parmesan and fresh mozzarella balancing it all out.",
      ingredients: ["Courgette", "Blue cheese", "Parmesan", "Fresh mozzarella"],
      rating: "92% (27)"
    },
    {
      id: 'chick-tick-boom',
      name: "Chick Tick Boom",
      price: 172.00,
      description: "Spicy chicken tikka, sweet peppadews, and a burst of fresh coriander dance on a delicious crust.",
      ingredients: ["Chicken tikka", "Peppadews", "Fresh coriander"],
      rating: "89% (47)"
    },
    {
      id: 'artichoke-ham',
      name: "Artichoke & Ham",
      price: 172.00,
      description: "Sourdough elevates the classics! Tangy sauce, melty cheese, ham, mushrooms, artichoke leaves & olives for a taste sensation.",
      ingredients: ["Ham", "Mushrooms", "Artichoke leaves", "Olives", "Cheese", "Tangy sauce"],
      rating: "93% (66)"
    },
    {
      id: 'janes-dough',
      name: "Jane's Dough",
      price: 109.00,
      description: "Fragrant sourdough focaccia, dimpled and golden, bursts with garlicky goodness, salty olives, and vibrant seasonal herbs. A touch of olive oil completes this symphony of flavours.",
      ingredients: ["Sourdough focaccia", "Garlic", "Olives", "Seasonal herbs", "Olive oil"],
      rating: "75% (8)"
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
            <div className="mt-1">
              <span className="text-sm text-amber-500">{item.rating}</span>
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