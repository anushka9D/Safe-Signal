
import * as Location from "expo-location";

export type SimpleLocation = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  capturedAt: number;
};

export async function getUserLocationOnce(): Promise<SimpleLocation | null> {
  
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  
  const last = await Location.getLastKnownPositionAsync();
  if (last?.coords) {
    return {
      lat: last.coords.latitude,
      lng: last.coords.longitude,
      accuracy: last.coords.accuracy ?? null,
      capturedAt: Date.now(),
    };
  }

 
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced, 
  });

  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
    capturedAt: Date.now(),
  };
}
