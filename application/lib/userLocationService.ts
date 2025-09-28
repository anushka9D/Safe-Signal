import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  lastUpdated: Date;
}

export const getCurrentLocation = async (): Promise<UserLocation | null> => {
  try {
    // Request permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current location
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    // Get address (optional)
    let address = 'Location available';
    try {
      const reverseGeocoded = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (reverseGeocoded.length > 0) {
        const addr = reverseGeocoded[0];
        address = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
      }
    } catch (error) {
      console.log('Could not get address:', error);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const updateUserLocation = async (userId: string, location: UserLocation): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        lastUpdated: location.lastUpdated,
      }
    }, { merge: true });
    
    console.log('User location updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user location:', error);
    return false;
  }
};

export const getUserLocation = async (userId: string): Promise<UserLocation | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().location) {
      const locationData = userDoc.data().location;
      return {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        lastUpdated: locationData.lastUpdated?.toDate() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

export const requestLocationAndUpdate = async (userId: string): Promise<boolean> => {
  try {
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      return false;
    }
    
    return await updateUserLocation(userId, currentLocation);
  } catch (error) {
    console.error('Error requesting location and updating:', error);
    return false;
  }
};