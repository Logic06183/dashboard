import React from 'react';
import ReactDOM from 'react-dom/client';
import DirectFirestoreTest from './components/DirectFirestoreTest';
import './App.css';

function FirebaseTestApp() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Firebase Direct Test</h1>
      <DirectFirestoreTest />
    </div>
  );
}

// Create a separate entry point for testing
const root = document.createElement('div');
root.id = 'firebase-test-root';
document.body.appendChild(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <FirebaseTestApp />
  </React.StrictMode>
);

export default FirebaseTestApp;
