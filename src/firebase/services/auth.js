import { auth } from '../config';
import { firestoreService } from './firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';

class AuthService {
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        display: 'popup',
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      await firestoreService.setUser(result.user.uid, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        lastLogin: new Date()
      });

      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
}

export const authService = new AuthService(); 