import { Platform } from 'react-native';
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

export type GeocodedAddress = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

// Real geocoding via the device's OS-level service (Apple Maps on iOS, Google on
// Android) — no external API key needed, unlike the Google Places API.
export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const results = await Location.geocodeAsync(address);
  if (results.length === 0) return null;

  const { latitude, longitude } = results[0];
  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => [null]);

  const formattedAddress = place
    ? [place.street, place.postalCode, place.city].filter(Boolean).join(', ')
    : address;

  return { latitude, longitude, formattedAddress };
}

export function mapsUrl(latitude: number, longitude: number, label?: string): string {
  const query = label ? encodeURIComponent(label) : `${latitude},${longitude}`;
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
