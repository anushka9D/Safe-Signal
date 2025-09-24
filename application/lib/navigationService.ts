import * as Location from 'expo-location';
import { SafeLocation } from './safeLocations';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface NavigationRoute {
  points: RoutePoint[];
  distance: number; // in kilometers
  duration: number; // in minutes
  instructions: string[];
}

export interface NavigationState {
  isNavigating: boolean;
  destination: SafeLocation | null;
  route: NavigationRoute | null;
  currentLocation: RoutePoint | null;
  remainingDistance: number;
  estimatedTimeArrival: number;
  nextInstruction: string;
}

// Simple route calculation using realistic waypoints
export const calculateRoute = async (
  start: RoutePoint,
  end: RoutePoint
): Promise<NavigationRoute> => {
  try {
    const directDistance = calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
    
    // Create more realistic route with multiple waypoints
    const points: RoutePoint[] = [start];
    
    // Add waypoints based on distance (more waypoints for longer routes)
    const numWaypoints = Math.max(4, Math.min(10, Math.floor(directDistance * 15)));
    
    for (let i = 1; i < numWaypoints; i++) {
      const ratio = i / numWaypoints;
      
      // Add some offset to simulate following roads
      const offsetLat = (Math.random() - 0.5) * 0.002;
      const offsetLng = (Math.random() - 0.5) * 0.002;
      
      // Create zigzag pattern to simulate real roads
      if (i % 2 === 0) {
        // Move more in latitude direction first
        points.push({
          latitude: start.latitude + (end.latitude - start.latitude) * ratio + offsetLat,
          longitude: start.longitude + (end.longitude - start.longitude) * (ratio * 0.7) + offsetLng
        });
      } else {
        // Move more in longitude direction
        points.push({
          latitude: start.latitude + (end.latitude - start.latitude) * (ratio * 0.8) + offsetLat,
          longitude: start.longitude + (end.longitude - start.longitude) * ratio + offsetLng
        });
      }
    }
    
    points.push(end);
    
    // Calculate more realistic distance (approximately 15% longer than direct)
    const routeDistance = directDistance * 1.15;
    
    // Estimate duration (average 35 km/h in city with traffic)
    const estimatedDuration = (routeDistance / 35) * 60; // minutes
    
    const instructions = [
      'Head towards your destination',
      'Continue on the main road',
      'Turn as needed to stay on route',
      'Approaching destination',
      'You have arrived at your destination'
    ];
    
    return {
      points,
      distance: routeDistance,
      duration: estimatedDuration,
      instructions
    };
  } catch (error) {
    console.error('Error calculating route:', error);
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

// Navigation tracking class
export class NavigationTracker {
  private navigationState: NavigationState = {
    isNavigating: false,
    destination: null,
    route: null,
    currentLocation: null,
    remainingDistance: 0,
    estimatedTimeArrival: 0,
    nextInstruction: ''
  };

  private locationSubscription: Location.LocationSubscription | null = null;
  private onUpdateCallback: ((state: NavigationState) => void) | null = null;

  async startNavigation(
    destination: SafeLocation,
    onUpdate: (state: NavigationState) => void
  ): Promise<void> {
    this.onUpdateCallback = onUpdate;

    // Get current location
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    const start: RoutePoint = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude
    };

    const end: RoutePoint = {
      latitude: destination.latitude,
      longitude: destination.longitude
    };

    // Calculate route
    const route = await calculateRoute(start, end);

    // Update navigation state
    this.navigationState = {
      isNavigating: true,
      destination,
      route,
      currentLocation: start,
      remainingDistance: route.distance,
      estimatedTimeArrival: route.duration,
      nextInstruction: route.instructions[0] || ''
    };

    // Start location tracking
    this.startLocationTracking();

    // Notify initial state
    this.onUpdateCallback(this.navigationState);
  }

  private async startLocationTracking(): Promise<void> {
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000, // Update every 2 seconds
        distanceInterval: 5, // Update every 5 meters
      },
      (location) => {
        this.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    );
  }

  private updateLocation(newLocation: RoutePoint): void {
    if (!this.navigationState.isNavigating || !this.navigationState.destination) {
      return;
    }

    // Update current location
    this.navigationState.currentLocation = newLocation;

    // Calculate remaining distance to destination
    const remainingDistance = calculateDistance(
      newLocation.latitude,
      newLocation.longitude,
      this.navigationState.destination.latitude,
      this.navigationState.destination.longitude
    );

    this.navigationState.remainingDistance = remainingDistance;

    // Update ETA (assuming average speed of 40 km/h)
    this.navigationState.estimatedTimeArrival = (remainingDistance / 40) * 60;

    // Check if arrived (within 50 meters)
    if (remainingDistance < 0.05) { // 50 meters = 0.05 km
      this.stopNavigation();
      this.navigationState.nextInstruction = 'You have arrived at your destination!';
    } else {
      // Update instruction based on distance
      if (remainingDistance < 0.1) { // Less than 100m
        this.navigationState.nextInstruction = 'Arriving at destination';
      } else if (remainingDistance < 0.5) { // Less than 500m
        this.navigationState.nextInstruction = 'Approaching destination';
      } else {
        this.navigationState.nextInstruction = 'Continue towards destination';
      }
    }

    // Notify update
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.navigationState);
    }
  }

  stopNavigation(): void {
    this.navigationState.isNavigating = false;
    
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.navigationState);
    }
  }

  getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }
}

// Export singleton instance
export const navigationTracker = new NavigationTracker();