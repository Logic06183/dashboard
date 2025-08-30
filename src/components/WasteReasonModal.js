import React, { useState } from 'react';

const WasteReasonModal = ({ isOpen, onClose, onConfirm, orderData, wasteType = 'order' }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [wastedBy, setWastedBy] = useState('');
  const [selectedPizzaIndexes, setSelectedPizzaIndexes] = useState([]);

  // Waste reason categories
  const wasteReasons = {
    customer: [
      'Customer dissatisfaction',
      'Customer cancelled order',
      'Customer refused delivery',
      'Wrong order delivered'
    ],
    kitchen: [
      'Duplicate pizza made',
      'Kitchen error/mistake',
      'Overcooked/burned',
      'Wrong ingredients used',
      'Dropped/contaminated food',
      'Equipment malfunction'
    ],
    delivery: [
      'Delivery driver issue',
      'Order returned cold',
      'External platform error',
      'Address not found'
    ],
    other: [
      'Test order',
      'Staff meal',
      'Other reason'
    ]
  };

  const allReasons = [
    ...wasteReasons.customer,
    ...wasteReasons.kitchen,
    ...wasteReasons.delivery,
    ...wasteReasons.other
  ];

  // Handle pizza selection for partial waste
  const handlePizzaSelection = (index) => {
    if (selectedPizzaIndexes.includes(index)) {
      setSelectedPizzaIndexes(selectedPizzaIndexes.filter(i => i !== index));
    } else {
      setSelectedPizzaIndexes([...selectedPizzaIndexes, index]);
    }
  };

  const handleConfirm = () => {
    if (!selectedReason) {
      alert('Please select a waste reason');
      return;
    }

    if (wasteType === 'pizza' && selectedPizzaIndexes.length === 0) {
      alert('Please select at least one pizza to mark as waste');
      return;
    }

    const wasteData = {
      reason: selectedReason,
      details: details.trim(),
      wastedBy: wastedBy.trim() || 'Unknown',
      pizzaIndexes: wasteType === 'pizza' ? selectedPizzaIndexes : null
    };

    onConfirm(wasteData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setDetails('');
    setWastedBy('');
    setSelectedPizzaIndexes([]);
    onClose();
  };

  if (!isOpen) return null;

  const totalValue = wasteType === 'order' 
    ? orderData?.totalAmount || 0
    : selectedPizzaIndexes.reduce((sum, index) => {
        const pizza = orderData?.pizzas?.[index];
        return sum + (pizza?.totalPrice || 0);
      }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-600">
            Mark {wasteType === 'order' ? 'Order' : 'Pizzas'} as Waste
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> This action cannot be undone. The {wasteType} will be marked as waste and removed from active orders.
          </p>
        </div>

        {/* Order Information */}
        <div className="mb-6 p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Order Details:</h3>
          <p><strong>Customer:</strong> {orderData?.customerName || 'Unknown'}</p>
          <p><strong>Platform:</strong> {orderData?.platform || 'Unknown'}</p>
          <p><strong>Order Time:</strong> {orderData?.orderTime ? new Date(orderData.orderTime).toLocaleTimeString() : 'Unknown'}</p>
          {wasteType === 'order' && (
            <p><strong>Total Value:</strong> R{orderData?.totalAmount?.toFixed(2) || '0.00'}</p>
          )}
        </div>

        {/* Pizza Selection for Partial Waste */}
        {wasteType === 'pizza' && orderData?.pizzas && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Select Pizzas to Mark as Waste:</h3>
            <div className="space-y-2 max-h-40 overflow-auto">
              {orderData.pizzas.map((pizza, index) => (
                <label key={index} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedPizzaIndexes.includes(index)}
                    onChange={() => handlePizzaSelection(index)}
                    className="w-4 h-4 text-red-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium">{pizza.pizzaType}</span>
                    <span className="text-gray-500 ml-2">×{pizza.quantity}</span>
                    <span className="text-green-600 ml-2">R{pizza.totalPrice?.toFixed(2)}</span>
                    {pizza.specialInstructions && (
                      <p className="text-xs text-gray-500">{pizza.specialInstructions}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {selectedPizzaIndexes.length > 0 && (
              <p className="mt-2 text-sm text-red-600">
                <strong>Selected Waste Value:</strong> R{totalValue.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Waste Reason Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Waste Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500"
            required
          >
            <option value="">Select a reason...</option>
            <optgroup label="Customer Related">
              {wasteReasons.customer.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </optgroup>
            <optgroup label="Kitchen/Operational">
              {wasteReasons.kitchen.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </optgroup>
            <optgroup label="Delivery/External">
              {wasteReasons.delivery.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {wasteReasons.other.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Additional Details */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Additional Details (optional)
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide additional context about the waste..."
            className="w-full p-2 border border-gray-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500"
            rows="3"
          />
        </div>

        {/* Staff Member */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Your Name/Staff ID
          </label>
          <input
            type="text"
            value={wastedBy}
            onChange={(e) => setWastedBy(e.target.value)}
            placeholder="Enter your name or staff ID"
            className="w-full p-2 border border-gray-300 rounded focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Waste Value Summary */}
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">
            <strong>Total Waste Value:</strong> R{totalValue.toFixed(2)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            disabled={!selectedReason || (wasteType === 'pizza' && selectedPizzaIndexes.length === 0)}
          >
            Mark as Waste
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasteReasonModal;