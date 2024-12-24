# John Dough's Sourdough Pizzeria Dashboard

A modern, real-time dashboard for managing pizza orders and tracking business metrics. Built with React and styled with Tailwind CSS.

![John Dough's Logo](public/logo.png)

## Features

- 📊 Real-time order tracking and management
- 🕒 Order timeline with status indicators
- 📈 Business analytics and insights
- 🏪 Kitchen display system
- 💫 Modern UI with smooth animations
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend Framework:** React 19
- **Routing:** React Router 7
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```
The app will open at [http://localhost:3000](http://localhost:3000)

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

## Features

### Dashboard
- Today's order statistics
- Real-time order timeline
- Peak hours analysis
- Revenue tracking
- Order status management

### Kitchen Display
- Active order monitoring
- Order prioritization
- Status updates
- Wait time tracking

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
