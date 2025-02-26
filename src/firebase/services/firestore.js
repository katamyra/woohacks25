"use client";
import { db } from "../config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  DocumentData,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

class FirestoreService {
  // Collection references
  collections = {
    tests: "test_collection",
    users: "users",
    userData: "userData",
  };

  // Test connection
  async testConnection() {
    try {
      const docRef = await addDoc(collection(db, this.collections.tests), {
        test: "Hello Firebase!",
        timestamp: new Date(),
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
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  }

  async getUserData(uid) {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, this.collections.users), where("uid", "==", uid))
      );
      return querySnapshot.docs[0]?.data();
    } catch (error) {
      throw error;
    }
  }

  async setUser(uid, userData) {
    try {
      const userRef = doc(db, this.collections.users, uid);
      await setDoc(userRef, userData, { merge: true });
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(uid, data) {
    try {
      await updateDoc(doc(db, "users", uid), data);
      return true;
    } catch (error) {
      console.error("Firestore update error:", error);
      throw new Error("Failed to update user document");
    }
  }
}

// Export a single instance
export const firestoreService = new FirestoreService();
