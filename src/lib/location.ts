import * as Location from 'expo-location';

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  city: string | null;
};

export async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Localisation refusée. Active-la dans les réglages pour continuer.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [place] = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }).catch(() => [null]);

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    city: place?.city ?? place?.subregion ?? null,
  };
}

export function toGeographyPoint(latitude: number, longitude: number): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}
