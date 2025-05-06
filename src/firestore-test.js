import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Function to test writing to Firestore
export const testFirestoreWrite = async () => {
  try {
    // Add a test document to Firestore
    const docRef = await addDoc(collection(db, 'test-collection'), {
      message: 'Test message',
      timestamp: new Date().toISOString()
    });
    console.log('Test document written with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding test document:', error);
    return null;
  }
};

// Function to test reading from Firestore
export const testFirestoreRead = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'test-collection'));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    console.log('Retrieved documents:', documents);
    return documents;
  } catch (error) {
    console.error('Error reading test documents:', error);
    return [];
  }
};
