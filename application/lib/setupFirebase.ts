import { initializeSafeLocations } from '../lib/safeLocations';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../config/firebase-config';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Test Firebase connection and permissions
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic connection by trying to read from a collection
    const testQuery = await getDocs(collection(db, 'safe_locations'));
    console.log('Firebase connection successful!');
    console.log('Collection exists:', !testQuery.empty);
    console.log('Document count:', testQuery.size);
    
    return true;
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    
    if (error?.code === 'permission-denied') {
      console.error('❌ Permission denied. Please update Firestore security rules.');
      console.error('Required rule: allow read: if true; for safe_locations collection');
    }
    
    return false;
  }
};

/**
 * This utility script initializes the Firebase database with safe location data.
 * Call this function to create the safe_locations collection and populate it with data.
 */
export const setupFirebaseData = async (): Promise<void> => {
  try {
    console.log('Setting up Firebase data...');
    
    // First test the connection
    const connectionOk = await testFirebaseConnection();
    if (!connectionOk) {
      throw new Error('Firebase connection failed. Please check security rules.');
    }
    
    // Sign in anonymously to get write permissions
    if (!auth.currentUser) {
      console.log('Signing in anonymously...');
      await signInAnonymously(auth);
      console.log('Signed in successfully');
    }
    
    // Initialize the safe locations collection
    await initializeSafeLocations();
    console.log('Firebase data setup completed successfully!');
  } catch (error) {
    console.error('Failed to setup Firebase data:', error);
    throw error;
  }
};

// Export this function to be called manually
export { initializeSafeLocations };