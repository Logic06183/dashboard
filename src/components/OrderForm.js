// src/components/OrderForm.js
import React, { useState } from 'react';

const PIZZA_MENU = {
  'The Champ Pizza': {
    price: 179.00,
    description: "Pepperoni is the most popular ingredient on pizza, worldwide. We love it! Simply done with spring onions and parmesan to champion the pepperoni.",
    ingredients: ["Pepperoni", "Spring onions", "Parmesan"],
    prepTime: 15,
    rating: 93,
    reviews: 384,
    isPopular: true,
    rank: 1
  },
  'Pig in Paradise': {
    price: 169.00,
    description: "This little piggy went to Hawaii. Sourdough, sauce, cheese, bacon and caramelised pineapple.",
    ingredients: ["Bacon", "Caramelized pineapple", "Cheese", "Pizza sauce"],
    prepTime: 15,
    rating: 97,
    reviews: 283,
    isPopular: true,
    rank: 2
  },
  'Lekker\'izza': {
    price: 194.00,
    description: "Bacon, chorizo sausage, peppadews, feta and fresh herbs.",
    ingredients: ["Bacon", "Chorizo sausage", "Peppadews", "Feta", "Fresh herbs"],
    prepTime: 20,
    rating: 96,
    reviews: 66,
    isPopular: true,
    rank: 3
  },
  'Mushroom Cloud Pizza': {
    price: 174.00,
    description: "A troop of mushrooms amongst clouds of goat's cheese, showered in sunflower seeds and sprinkled with chilli-infused olive oil. We also add garlic and caramelised onions for good measure.",
    ingredients: ["Mushrooms", "Goat's cheese", "Sunflower seeds", "Chilli-infused olive oil", "Garlic", "Caramelized onions"],
    prepTime: 18,
    rating: 98,
    reviews: 166,
    isVegetarian: true
  },
  'Mish-Mash Pizza': {
    price: 192.00,
    description: "Parma ham, fig preserve, goat's cheese & rocket, enough said.",
    ingredients: ["Parma ham", "Fig preserve", "Goat's cheese", "Rocket"],
    prepTime: 20,
    rating: 96,
    reviews: 159
  },
  'Artichoke & Ham': {
    price: 172.00,
    description: "Sourdough elevates the classics! Tangy sauce, melty cheese, ham, mushrooms, artichoke leaves & olives for a taste sensation.",
    ingredients: ["Ham", "Mushrooms", "Artichoke leaves", "Olives", "Cheese", "Tangy sauce"],
    prepTime: 18,
    rating: 95,
    reviews: 43
  },
  'Chick Tick Boom': {
    price: 172.00,
    description: "Spicy chicken tikka, sweet peppadews, and a burst of fresh coriander dance on a delicious crust.",
    ingredients: ["Chicken tikka", "Peppadews", "Fresh coriander"],
    prepTime: 18,
    rating: 96,
    reviews: 28
  },
  'Poppa\'s Pizza': {
    price: 179.00,
    description: "Love it - anchovies, olives, fresh mozzarella and basil.",
    ingredients: ["Anchovies", "Olives", "Fresh mozzarella", "Basil"],
    prepTime: 15,
    rating: 90,
    reviews: 65
  },
  'Vegan Harvest Pizza': {
    price: 189.00,
    description: "A delectable combination of tangy sourdough crust topped with a medley of earthy mushrooms, tender baby marrow, Kalamata olives, zesty sundried tomatoes, and fragrant seasonal fresh herbs. Finished with a creamy dollop of hummus and a drizzle of rich olive oil.",
    ingredients: ["Mushrooms", "Baby marrow", "Kalamata olives", "Sundried tomatoes", "Fresh herbs", "Hummus", "Olive oil"],
    prepTime: 20,
    rating: 96,
    reviews: 55,
    isVegetarian: true,
    isVegan: true
  },
  'Spud Pizza': {
    price: 149.00,
    description: "A crispy potato topping on a sourdough pizza base with rosemary, salt flakes, caramelised onion and finished off with chilli oil and parmesan. The only thing better than sourdough, is potato slices on sourdough.",
    ingredients: ["Potato", "Rosemary", "Salt flakes", "Caramelized onion", "Chilli oil", "Parmesan"],
    prepTime: 20,
    rating: 94,
    reviews: 118,
    isVegetarian: true
  },
  'The Zesty Zucchini': {
    price: 149.00,
    description: "A Pizza Bianca (no pizza sauce) showcasing the star ingredient of courgette, with tangy blue cheese adding zest and flavor, and parmesan and fresh mozzarella balancing it all out.",
    ingredients: ["Zucchini", "Blue cheese", "Parmesan", "Fresh mozzarella"],
    prepTime: 15,
    rating: 95,
    reviews: 23,
    isVegetarian: true
  },
  'Margie Pizza': {
    price: 149.00,
    description: "John Dough's Margherita made with a sourdough base, tomato pizza sauce, fresh mozzarella & basil. Simply delicious!",
    ingredients: ["Fresh mozzarella", "Basil", "Pizza sauce"],
    prepTime: 12,
    rating: 92,
    reviews: 352,
    isVegetarian: true
  },
  'Sunshine Margherita': {
    price: 149.00,
    description: "A basil pesto sauce topped with ricotta cheese, sundried tomatoes and fresh basil. Pizza Bianca (no sauce)",
    ingredients: ["Basil pesto", "Ricotta cheese", "Sundried tomatoes", "Fresh basil"],
    prepTime: 12,
    rating: 94,
    reviews: 0,
    isVegetarian: true
  }
};

const extraToppingsOptions = [
  "Extra cheese",
  "Mushrooms",
  "Pepperoni",
  "Olives",
  "Bacon",
  "Anchovies",
  "Chicken",
  "Peppadews",
  "Feta",
  "Artichokes",
  "Sundried tomatoes",
  "Fresh basil",
  "Rocket",
  "Caramelized onions",
  "Goat's cheese",
  "Parmesan shavings"
];

const OrderForm = ({ onSubmit }) => {
  const [orderItems, setOrderItems] = useState([{
    pizzaType: '',
    size: 'medium',
    extraToppings: [],
    quantity: 1
  }]);

  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    phone: '',
    address: '',
    notes: '',
    urgency: '20'
  });

  const handleAddPizza = () => {
    setOrderItems([...orderItems, {
      pizzaType: '',
      size: 'medium',
      extraToppings: [],
      quantity: 1
    }]);
  };

  const handleRemovePizza = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePizzaChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      if (!item.pizzaType) return total;
      
      const pizza = PIZZA_MENU[item.pizzaType];
      const basePrice = pizza.price;
      const extraToppingsPrice = item.extraToppings.length * 15; // R15 per extra topping
      const sizeAdjustment = 
        item.size === 'small' ? -20 :
        item.size === 'large' ? 30 : 0;

      return total + ((basePrice + extraToppingsPrice + sizeAdjustment) * item.quantity);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const orderTime = new Date();
    const dueTime = new Date(orderTime.getTime() + parseInt(customerInfo.urgency) * 60000);
    
    const order = {
      orderId: `ORDER-${Date.now()}`,
      customerName: customerInfo.customerName,
      phone: customerInfo.phone,
      address: customerInfo.address,
      notes: customerInfo.notes,
      items: orderItems,
      orderTime: orderTime.toISOString(),
      dueTime: dueTime.toISOString(),
      status: 'pending',
      total: calculateTotal()
    };

    onSubmit(order);

    // Reset form state
    setOrderItems([{
      pizzaType: '',
      size: 'medium',
      extraToppings: [],
      quantity: 1
    }]);
    setCustomerInfo({
      customerName: '',
      phone: '',
      address: '',
      notes: '',
      urgency: '20'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-secondary rounded-xl shadow-lg border border-secondary-light">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-primary">Place Pizza Order</h2>
        
        {/* Customer Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Customer Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
              value={customerInfo.customerName}
              onChange={(e) => setCustomerInfo({...customerInfo, customerName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Phone</label>
            <input
              type="tel"
              required
              className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Address</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Urgency (Minutes until due)</label>
            <select
              className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
              value={customerInfo.urgency}
              onChange={(e) => setCustomerInfo({...customerInfo, urgency: e.target.value})}
            >
              <option value="10">10 minutes (Urgent)</option>
              <option value="15">15 minutes (High Priority)</option>
              <option value="20">20 minutes (Normal)</option>
              <option value="30">30 minutes (Relaxed)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Special Notes</label>
            <textarea
              className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
              rows="2"
            />
          </div>
        </div>

        {/* Pizza Items */}
        <div className="space-y-6">
          {orderItems.map((item, index) => (
            <div key={index} className="border border-secondary-light rounded-lg p-4 bg-secondary">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-primary">Pizza #{index + 1}</h3>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePizza(index)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Pizza Type</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                    value={item.pizzaType}
                    onChange={(e) => handlePizzaChange(index, 'pizzaType', e.target.value)}
                  >
                    <option value="">Select a pizza</option>
                    {Object.entries(PIZZA_MENU).map(([name, pizza]) => (
                      <option key={name} value={name}>
                        {name} - R{pizza.price} ({pizza.rating}% 👍 {pizza.reviews} reviews)
                      </option>
                    ))}
                  </select>
                  {item.pizzaType && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-400">
                        {PIZZA_MENU[item.pizzaType].description}
                      </p>
                      <p className="text-sm text-gray-400">
                        Ingredients: {PIZZA_MENU[item.pizzaType].ingredients.join(', ')}
                      </p>
                      <p className="text-sm text-gray-400">
                        Prep Time: {PIZZA_MENU[item.pizzaType].prepTime} minutes
                      </p>
                      {PIZZA_MENU[item.pizzaType].isVegetarian && (
                        <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded">Vegetarian</span>
                      )}
                      {PIZZA_MENU[item.pizzaType].isVegan && (
                        <span className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded ml-2">Vegan</span>
                      )}
                      {PIZZA_MENU[item.pizzaType].isPopular && (
                        <span className="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded ml-2">Popular #{PIZZA_MENU[item.pizzaType].rank}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Size</label>
                  <select
                    className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                    value={item.size}
                    onChange={(e) => handlePizzaChange(index, 'size', e.target.value)}
                  >
                    <option value="small">Small (-R20)</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large (+R30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                    value={item.quantity}
                    onChange={(e) => handlePizzaChange(index, 'quantity', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Extra Toppings (R15 each)
                  </label>
                  <select
                    multiple
                    className="mt-1 block w-full rounded-md bg-secondary-light border-secondary-light text-gray-200 focus:border-primary focus:ring-primary"
                    value={item.extraToppings}
                    onChange={(e) => handlePizzaChange(index, 'extraToppings', 
                      Array.from(e.target.selectedOptions, option => option.value))}
                  >
                    {extraToppingsOptions.map(topping => (
                      <option key={topping} value={topping}>{topping}</option>
                    ))}
                  </select>
                </div>

                {/* Price Breakdown */}
                {item.pizzaType && (
                  <div className="mt-4 p-4 bg-secondary-light rounded-lg">
                    <h4 className="text-primary font-medium mb-2">Price Breakdown</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span>R{PIZZA_MENU[item.pizzaType].price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size Adjustment:</span>
                        <span>{item.size === 'small' ? '-R20' : item.size === 'large' ? '+R30' : 'R0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Toppings ({item.extraToppings.length} × R15):</span>
                        <span>+R{item.extraToppings.length * 15}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>×{item.quantity}</span>
                      </div>
                      <div className="border-t border-gray-600 mt-2 pt-2 font-medium text-primary">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>R{(
                            (PIZZA_MENU[item.pizzaType].price + 
                            (item.size === 'small' ? -20 : item.size === 'large' ? 30 : 0) + 
                            (item.extraToppings.length * 15)) * 
                            item.quantity
                          ).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="mt-6 p-4 bg-secondary-light rounded-lg">
          <div className="flex justify-between items-center text-lg font-bold text-primary">
            <span>Order Total:</span>
            <span>R{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 space-x-4">
          <button
            type="button"
            onClick={handleAddPizza}
            className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary hover:bg-primary hover:text-secondary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add Another Pizza
          </button>

          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-secondary-dark bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Place Order
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;