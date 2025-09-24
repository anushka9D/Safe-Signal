// Firebase Collection Setup Script
// Run this file to initialize your Firebase collections

import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-config';

export interface InitializationResult {
  success: boolean;
  message: string;
  collections: string[];
}

export const initializeFirebaseCollections = async (): Promise<InitializationResult> => {
  try {
    const result: InitializationResult = {
      success: true,
      message: 'Firebase collections initialized successfully',
      collections: []
    };

    // Initialize Family Collection
    try {
      const familyRef = collection(db, 'family');
      const familySnapshot = await getDocs(familyRef);
      
      if (familySnapshot.empty) {
        // Create a dummy document to initialize the collection
        const initDoc = doc(familyRef, '_init');
        await setDoc(initDoc, {
          _initialized: true,
          createdAt: new Date(),
          note: 'This document initializes the family collection. It can be deleted after real data is added.'
        });
        console.log('Family collection initialized');
      } else {
        console.log('Family collection already exists');
      }
      result.collections.push('family');
    } catch (error) {
      console.error('Error initializing family collection:', error);
    }

    // Initialize Users Collection (if needed)
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      if (usersSnapshot.empty) {
        // Create a dummy document to initialize the collection
        const initDoc = doc(usersRef, '_init');
        await setDoc(initDoc, {
          _initialized: true,
          createdAt: new Date(),
          note: 'This document initializes the users collection. It can be deleted after real data is added.'
        });
        console.log('Users collection initialized');
      } else {
        console.log('Users collection already exists');
      }
      result.collections.push('users');
    } catch (error) {
      console.error('Error initializing users collection:', error);
    }

    // Initialize Safe Locations Collection (if needed)
    try {
      const safeLocationsRef = collection(db, 'safe_locations');
      const safeLocationsSnapshot = await getDocs(safeLocationsRef);
      
      if (safeLocationsSnapshot.empty) {
        // Create a dummy document to initialize the collection
        const initDoc = doc(safeLocationsRef, '_init');
        await setDoc(initDoc, {
          _initialized: true,
          createdAt: new Date(),
          note: 'This document initializes the safe_locations collection. It can be deleted after real data is added.'
        });
        console.log('Safe locations collection initialized');
      } else {
        console.log('Safe locations collection already exists');
      }
      result.collections.push('safe_locations');
    } catch (error) {
      console.error('Error initializing safe_locations collection:', error);
    }

    return result;
  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
    return {
      success: false,
      message: `Failed to initialize collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
      collections: []
    };
  }
};

// Helper function to create a sample user (for testing)
export const createSampleUser = async (email: string, name: string) => {
  try {
    const usersRef = collection(db, 'users');
    const userDoc = doc(usersRef);
    
    await setDoc(userDoc, {
      email: email.toLowerCase(),
      name: name,
      createdAt: new Date(),
      isActive: true
    });
    
    console.log(`Sample user created: ${email}`);
    return true;
  } catch (error) {
    console.error('Error creating sample user:', error);
    return false;
  }
};

// Helper function to check collection status
export const checkCollectionStatus = async () => {
  try {
    const collections = ['family', 'users', 'safe_locations'];
    const status: Record<string, any> = {};
    
    for (const collectionName of collections) {
      try {
        const ref = collection(db, collectionName);
        const snapshot = await getDocs(ref);
        status[collectionName] = {
          exists: true,
          documentCount: snapshot.size,
          isEmpty: snapshot.empty
        };
      } catch (error) {
        status[collectionName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return status;
  } catch (error) {
    console.error('Error checking collection status:', error);
    return null;
  }
};