import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FirebaseDirectForm from './FirebaseDirectForm';

// Mock Firebase
jest.mock('firebase/compat/app', () => ({
  initializeApp: jest.fn(),
  apps: [],
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'test-order-id' }))
    }))
  }))
}));

// Mock CustomerService
jest.mock('../services/CustomerService', () => ({
  default: {
    searchCustomers: jest.fn(() => Promise.resolve([])),
    getOrCreateCustomer: jest.fn(() => Promise.resolve({ 
      id: 'test-customer-id', 
      name: 'Test Customer',
      phone: '',
      category: 'New'
    })),
    updateCustomerStats: jest.fn(() => Promise.resolve())
  }
}));

// Mock useQueueCalculator hook
jest.mock('../hooks/useQueueCalculator', () => ({
  __esModule: true,
  default: () => ({
    calculateEstimatedPrepTime: jest.fn(() => 15),
    formatTimeEstimate: jest.fn((time) => `${time} minutes`),
    totalPizzasInQueue: 5,
    queueData: {}
  })
}));

describe('FirebaseDirectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the form correctly', () => {
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    expect(screen.getByText('Simple Direct Order')).toBeInTheDocument();
    expect(screen.getByText('Add Pizza')).toBeInTheDocument();
    expect(screen.getByText('Add Cold Drink')).toBeInTheDocument();
  });

  test('allows adding cold drinks without pizzas', async () => {
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    // Add a cold drink
    const addDrinkButton = screen.getByText('Add Cold Drink');
    fireEvent.click(addDrinkButton);
    
    // Should see cold drink selection
    await waitFor(() => {
      expect(screen.getByText(/Cold Drink/)).toBeInTheDocument();
    });
    
    // Enter customer name
    const customerInput = screen.getByPlaceholderText(/Customer Name/i);
    fireEvent.change(customerInput, { target: { value: 'Test Customer' } });
    
    // Submit the form
    const submitButton = screen.getByText(/Submit Order/i);
    fireEvent.click(submitButton);
    
    // Should not show error about needing pizzas
    await waitFor(() => {
      expect(screen.queryByText(/Please add at least one pizza/i)).not.toBeInTheDocument();
    });
  });

  test('shows error when no items are added', async () => {
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    // Enter customer name
    const customerInput = screen.getByPlaceholderText(/Customer Name/i);
    fireEvent.change(customerInput, { target: { value: 'Test Customer' } });
    
    // Submit without adding any items
    const submitButton = screen.getByText(/Submit Order/i);
    fireEvent.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Please add at least one pizza or cold drink/i)).toBeInTheDocument();
    });
  });

  test('allows removing pizzas when cold drinks exist', async () => {
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    // Add a pizza
    const addPizzaButton = screen.getByText('Add Pizza');
    fireEvent.click(addPizzaButton);
    
    // Add a cold drink
    const addDrinkButton = screen.getByText('Add Cold Drink');
    fireEvent.click(addDrinkButton);
    
    // Find and click remove pizza button
    const removePizzaButtons = screen.getAllByText('Remove');
    fireEvent.click(removePizzaButtons[0]); // Remove the pizza
    
    // Pizza should be removed, cold drink should remain
    await waitFor(() => {
      expect(screen.queryByText(/Pizza Type/)).not.toBeInTheDocument();
      expect(screen.getByText(/Cold Drink/)).toBeInTheDocument();
    });
  });

  test('calculates total price correctly with only cold drinks', async () => {
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    // Add a cold drink
    const addDrinkButton = screen.getByText('Add Cold Drink');
    fireEvent.click(addDrinkButton);
    
    // The total should show the price of the cold drink
    await waitFor(() => {
      const totalElement = screen.getByText(/Total:/);
      expect(totalElement).toBeInTheDocument();
      // Check that total is greater than 0 (cold drink price)
      expect(totalElement.textContent).toMatch(/R\d+/);
    });
  });

  test('submits order successfully with cold drinks only', async () => {
    const mockOnClose = jest.fn();
    const { container } = render(<FirebaseDirectForm onClose={mockOnClose} />);
    
    // Add a cold drink
    const addDrinkButton = screen.getByText('Add Cold Drink');
    fireEvent.click(addDrinkButton);
    
    // Enter customer name
    const customerInput = screen.getByPlaceholderText(/Customer Name/i);
    fireEvent.change(customerInput, { target: { value: 'Test Customer' } });
    
    // Submit the form
    const submitButton = screen.getByText(/Submit Order/i);
    fireEvent.click(submitButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/Order submitted successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('includes cold drinks in order object when submitting', async () => {
    const mockFirestore = {
      collection: jest.fn(() => ({
        add: jest.fn((orderData) => {
          // Verify the order contains cold drinks
          expect(orderData.coldDrinks).toBeDefined();
          expect(orderData.coldDrinks.length).toBeGreaterThan(0);
          expect(orderData.pizzas).toEqual([]);
          return Promise.resolve({ id: 'test-order-id' });
        })
      }))
    };
    
    // Mock Firebase with our custom implementation
    jest.mock('firebase/compat/app', () => ({
      initializeApp: jest.fn(),
      apps: [],
      firestore: jest.fn(() => mockFirestore)
    }));
    
    render(<FirebaseDirectForm onClose={jest.fn()} />);
    
    // Add a cold drink
    const addDrinkButton = screen.getByText('Add Cold Drink');
    fireEvent.click(addDrinkButton);
    
    // Enter customer name
    const customerInput = screen.getByPlaceholderText(/Customer Name/i);
    fireEvent.change(customerInput, { target: { value: 'Test Customer' } });
    
    // Submit the form
    const submitButton = screen.getByText(/Submit Order/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Order submitted successfully/i)).toBeInTheDocument();
    });
  });
});