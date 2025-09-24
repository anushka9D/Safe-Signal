import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

export interface SafeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: 'hospital' | 'fire_station' | 'police' | 'shelter' | 'emergency_center';
  phone?: string;
  isOperational: boolean;
  description?: string;
  capacity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SAFE_LOCATIONS_COLLECTION = 'safe_locations';

// Add initial safe locations to Firebase
export const initializeSafeLocations = async (): Promise<void> => {
  try {
    console.log('Checking safe locations collection...');
    
    // Try to get existing data first
    const existingData = await getDocs(
      query(collection(db, SAFE_LOCATIONS_COLLECTION), limit(1))
    );
    
    if (existingData.empty) {
      console.log('Collection is empty, initializing with sample data...');
      
      // Add just one sample location first to test
      const sampleLocation = {
        name: 'City General Hospital',
        latitude: 6.9271,
        longitude: 79.8612,
        address: 'Colombo 08, Sri Lanka',
        type: 'hospital' as const,
        phone: '+94112691111',
        isOperational: true,
        description: 'Main government hospital with emergency services',
        capacity: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await addDoc(collection(db, SAFE_LOCATIONS_COLLECTION), sampleLocation);
      console.log('Sample safe location added successfully!');
    } else {
      console.log('Safe locations collection already exists');
    }
  } catch (error: any) {
    console.error('Error initializing safe locations:', error);
    // If it's a permissions error, provide helpful message
    if (error?.code === 'permission-denied') {
      console.error('Permission denied. Please check Firestore security rules.');
    }
    throw error;
  }
};

// Fetch all safe locations
export const getAllSafeLocations = async (): Promise<SafeLocation[]> => {
  try {
    console.log('Fetching safe locations from:', SAFE_LOCATIONS_COLLECTION);
    
    // Simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, SAFE_LOCATIONS_COLLECTION),
      where('isOperational', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const locations: SafeLocation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        id: doc.id,
        ...data,
        // Ensure dates are properly converted
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as SafeLocation);
    });
    
    // Sort in memory instead of using orderBy
    locations.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Found ${locations.length} safe locations`);
    return locations;
  } catch (error) {
    console.error('Error fetching safe locations:', error);
    throw error;
  }
};

// Fetch safe locations by type
export const getSafeLocationsByType = async (type: SafeLocation['type']): Promise<SafeLocation[]> => {
  try {
    // Simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, SAFE_LOCATIONS_COLLECTION),
      where('type', '==', type),
      where('isOperational', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const locations: SafeLocation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      locations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as SafeLocation);
    });
    
    // Sort in memory
    locations.sort((a, b) => a.name.localeCompare(b.name));
    
    return locations;
  } catch (error) {
    console.error('Error fetching safe locations by type:', error);
    throw error;
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Find nearest safe locations to user within specified radius
export const getNearestSafeLocations = async (
  userLatitude: number,
  userLongitude: number,
  radiusKm: number = 5, // Default 5km radius
  limit: number = 20
): Promise<(SafeLocation & { distance: number })[]> => {
  try {
    const allLocations = await getAllSafeLocations();
    
    // Calculate distance for each location and filter by radius
    const locationsWithDistance = allLocations
      .map(location => {
        const distance = calculateDistance(
          userLatitude,
          userLongitude,
          location.latitude,
          location.longitude
        );
        return { ...location, distance };
      })
      .filter(location => location.distance <= radiusKm); // Only include locations within radius
    
    // Sort by distance and limit results
    return locationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding nearest safe locations:', error);
    throw error;
  }
};

// Add a new safe location
export const addSafeLocation = async (location: Omit<SafeLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const newLocation = {
      ...location,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, SAFE_LOCATIONS_COLLECTION), newLocation);
    return docRef.id;
  } catch (error) {
    console.error('Error adding safe location:', error);
    throw error;
  }
};