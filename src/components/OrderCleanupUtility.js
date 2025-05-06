import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Use the same Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// Initialize Firebase
let firebaseApp;
if (!firebase.apps.length) {
  firebaseApp = firebase.initializeApp(firebaseConfig);
} else {
  firebaseApp = firebase.apps[0];
}
const db = firebaseApp.firestore();

const OrderCleanupUtility = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleted, setDeleted] = useState([]);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // Fetch all orders
    const fetchOrders = async () => {
      try {
        const snapshot = await db.collection('orders').get();
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Add flags for test orders
          isCliTest: doc.data().source === 'cli' || doc.data().source?.includes('test'),
          isOldTest: !doc.data().dueTime || !doc.data().prepTimeMinutes
        }));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Delete a single order
  const deleteOrder = async (orderId) => {
    try {
      await db.collection('orders').doc(orderId).delete();
      setDeleted(prev => [...prev, orderId]);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      return true;
    } catch (err) {
      console.error(`Error deleting order ${orderId}:`, err);
      setError(`Failed to delete order ${orderId}: ${err.message}`);
      return false;
    }
  };

  // Delete all CLI test orders
  const deleteCliTestOrders = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    const cliOrders = orders.filter(order => order.isCliTest);
    let successCount = 0;

    for (const order of cliOrders) {
      const success = await deleteOrder(order.id);
      if (success) successCount++;
    }

    alert(`Deleted ${successCount} of ${cliOrders.length} CLI test orders.`);
    setConfirmDelete(false);
  };

  // Delete old orders without dueTime/prepTimeMinutes
  const deleteOldOrders = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    const oldOrders = orders.filter(order => order.isOldTest);
    let successCount = 0;

    for (const order of oldOrders) {
      const success = await deleteOrder(order.id);
      if (success) successCount++;
    }

    alert(`Deleted ${successCount} of ${oldOrders.length} old format orders.`);
    setConfirmDelete(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order Cleanup Utility</h1>
      <p className="text-gray-600 mb-6">
        This utility helps clean up test orders from the database. Use with caution as deletions cannot be undone.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-300 p-3 rounded text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading orders...</div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Order Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold">
                  {orders.filter(order => order.isCliTest).length}
                </div>
                <div className="text-sm text-gray-600">CLI Test Orders</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold">
                  {orders.filter(order => order.isOldTest).length}
                </div>
                <div className="text-sm text-gray-600">Old Format Orders</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={deleteCliTestOrders}
              className={`px-4 py-2 rounded-lg ${
                confirmDelete && orders.filter(order => order.isCliTest).length > 0
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white`}
              disabled={orders.filter(order => order.isCliTest).length === 0}
            >
              {confirmDelete && orders.filter(order => order.isCliTest).length > 0
                ? 'CONFIRM: Delete CLI Test Orders'
                : 'Delete CLI Test Orders'}
            </button>
            <button
              onClick={deleteOldOrders}
              className={`px-4 py-2 rounded-lg ${
                confirmDelete && orders.filter(order => order.isOldTest).length > 0
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-500 hover:bg-orange-600'
              } text-white`}
              disabled={orders.filter(order => order.isOldTest).length === 0}
            >
              {confirmDelete && orders.filter(order => order.isOldTest).length > 0
                ? 'CONFIRM: Delete Old Format Orders'
                : 'Delete Old Format Orders'}
            </button>
            {confirmDelete && (
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
            )}
          </div>

          {deleted.length > 0 && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
              <h3 className="font-medium text-green-800">Successfully deleted {deleted.length} orders</h3>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Order List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Order ID</th>
                    <th className="py-2 px-4 border-b text-left">Customer</th>
                    <th className="py-2 px-4 border-b text-left">Source</th>
                    <th className="py-2 px-4 border-b text-left">Created At</th>
                    <th className="py-2 px-4 border-b text-left">Format</th>
                    <th className="py-2 px-4 border-b text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className={order.isCliTest || order.isOldTest ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-4 border-b">{order.id.substring(0, 8)}...</td>
                      <td className="py-2 px-4 border-b">{order.customerName || 'Unknown'}</td>
                      <td className="py-2 px-4 border-b">
                        {order.source || 'Unknown'}
                        {order.isCliTest && <span className="ml-2 text-xs bg-yellow-200 px-1 rounded">CLI Test</span>}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {order.isOldTest ? (
                          <span className="text-xs bg-orange-200 px-1 rounded">Old Format</span>
                        ) : (
                          <span className="text-xs bg-green-200 px-1 rounded">New Format</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                          title="Delete this order"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCleanupUtility;
