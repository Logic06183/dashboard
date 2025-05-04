# John Dough's Sourdough Pizzeria Dashboard

A modern, real-time dashboard for managing pizza orders and tracking business metrics for John Dough's Sourdough Pizzeria in Linden, Johannesburg. Built with React and styled with Tailwind CSS.

![John Dough's Logo](public/logo.png)

## About John Dough's

Established in 2022, John Dough's Sourdough Pizzeria is a family-run business located at 44 1st Avenue, Linden, Randburg, Johannesburg. What sets this pizzeria apart is its unwavering passion for pizza and commitment to crafting the perfect sourdough crust.

- **Phone:** 061 525 6829
- **Hours:** 12:00 - 20:30
- **Rating:** ★★★★★ (4.8)

## Features

- 📊 Real-time order tracking and management with customer name identification
- 🕒 Order timeline with status indicators and South African time format (24-hour)
- 📈 Interactive business analytics and insights in Rand (R)
- 🏪 Kitchen display system with row-based pizza organization
- 💫 Modern UI with smooth animations and South African localization
- 📱 Responsive design for all devices
- 📦 Inventory management and stock tracking
- 👥 Customer management system with platform tracking (Uber, Window, etc.)

## Core Components

### Order Management
- Google Forms-inspired order form with customer name field
- Platform selection (Uber, Mr. Delivery, Bolt, Window, Other)
- Row-based pizza ordering system for kitchen organization
- Special instructions and extra toppings tracking
- Preparation time input for urgency determination
- Real-time order preview before submission
- Automated total calculations in Rand (R)

### Kitchen Display System
- Table-based kitchen display with row organization
- Dynamic sorting by urgency (Very Late, Late, On Time)
- Color-coded status indicators for quick visual assessment
- Checkbox interface for marking pizzas as cooked
- Customer name and platform information display
- South African time format (24-hour) for all timestamps
- Due time calculation based on preparation time

### Dashboard Analytics
- Interactive sales and order analytics in Rand (R)
- Peak hour visualization and analysis
- Order tracking with customer information
- Performance metrics and KPIs
- Enhanced data visualization with modern charts

## Tech Stack

- **Frontend Framework:** React 18
- **Routing:** React Router 6
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Location:** Linden, Johannesburg, South Africa
- **Currency:** South African Rand (R)
- **Time Format:** South African Standard Time (24-hour)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/pizza-dashboard.git

# Navigate to the project directory
cd pizza-dashboard

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Customization for John Dough's

This dashboard has been specifically customized for John Dough's Sourdough Pizzeria in Linden, Johannesburg with the following features:

- **South African Localization**: All times are displayed in 24-hour format and all currency values use South African Rand (R)
- **Menu Integration**: The complete menu from John Dough's has been integrated, including specialty pizzas like Mish-Mash, Pig in Paradise, and Mushroom Cloud
- **Row-Based Kitchen System**: Orders are organized by row to match the physical layout of the kitchen
- **Platform Tracking**: Orders are tagged by platform (Uber, Window, etc.) for better management
- **Customer-Centric Design**: Orders are identified by customer name for easier reference
- **Branding**: Custom color scheme matching John Dough's branding

## Project Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── pages/           # Page components
│   │   │   ├── DashboardPage.js
│   │   │   └── KitchenDisplayPage.js
│   │   ├── OrderManagement.js
│   │   ├── StatsCard.js
│   │   └── ...
│   ├── styles/
│   │   └── tailwind.css    # Tailwind styles
│   └── App.js              # Main app component
├── public/
│   └── logo.png           # Brand assets
└── package.json           # Dependencies
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Deployment

Build the app for production:
```bash
npm run build
```

This creates an optimized build in the `build` folder, ready for deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is private and proprietary to John Dough's Sourdough Pizzeria.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
