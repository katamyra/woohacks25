import { db } from '../config';
import { collection, addDoc, getDocs, query, where, DocumentData } from 'firebase/firestore';

class FirestoreService {
  // Collection references
  collections = {
    tests: 'test_collection',
    users: 'users',
    // Add more collections as needed
  };

  // Test connection
  async testConnection() {
    try {
      const docRef = await addDoc(collection(db, this.collections.tests), {
        test: "Hello Firebase!",
        timestamp: new Date()
      });
      return { success: true, docId: docRef.id };
    } catch (error) {
      throw error;
    }
  }

  // Generic methods
  async add(collectionName, data) {
    try {
      return await addDoc(collection(db, collectionName), data);
    } catch (error) {
      throw error;
    }
  }

  async getAll(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw error;
    }
  }
}

// Export a single instance
export const firestoreService = new FirestoreService();
