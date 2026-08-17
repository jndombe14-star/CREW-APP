import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  label: string;
};

type Props = {
  latitude: number;
  longitude: number;
  markers: MapMarker[];
  onMarkerPress?: (id: string) => void;
  height?: number;
};

const TOMTOM_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;

// Same HTML/JS for both platforms: on native it runs inside a WebView (real DOM +
// TomTom's web SDK loaded from their CDN, which works fine in a WebView — unlike
// react-native-maps, which never rendered in plain Expo Go for this SDK). On web
// it's injected straight into the page via an iframe srcDoc, so there's exactly one
// map implementation instead of two to keep in sync.
function buildHtml(latitude: number, longitude: number, markers: MapMarker[]) {
  const markersJson = JSON.stringify(markers);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #eee; }
    .crew-pin {
      width: 16px; height: 16px; border-radius: 8px; border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .crew-me {
      width: 18px; height: 18px; border-radius: 9px; background: #1a73e8;
      border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(26,115,232,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"></script>
  <script>
    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      else window.parent.postMessage(msg, '*');
    }
    try {
      var map = tt.map({
        key: '${TOMTOM_KEY ?? ''}',
        container: 'map',
        center: [${longitude}, ${latitude}],
        zoom: 12,
      });
      map.addControl(new tt.NavigationControl());

      var me = document.createElement('div');
      me.className = 'crew-me';
      new tt.Marker({ element: me }).setLngLat([${longitude}, ${latitude}]).addTo(map);

      var markers = ${markersJson};
      markers.forEach(function (m) {
        var el = document.createElement('div');
        el.className = 'crew-pin';
        el.style.background = m.color;
        el.addEventListener('click', function () { post({ type: 'marker-press', id: m.id }); });
        new tt.Marker({ element: el }).setLngLat([m.longitude, m.latitude]).addTo(map);
      });

      map.on('load', function () { post({ type: 'ready' }); });
    } catch (e) {
      post({ type: 'error', message: String(e) });
    }
  </script>
</body>
</html>`;
}

export function TomTomMap({ latitude, longitude, markers, onMarkerPress, height = 260 }: Props) {
  const html = useMemo(() => buildHtml(latitude, longitude, markers), [latitude, longitude, markers]);

  if (!TOMTOM_KEY) {
    return (
      <View style={[styles.fallback, { height }]}>
        <MissingKeyNotice />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return <WebMapFrame html={html} height={height} onMarkerPress={onMarkerPress} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'marker-press') onMarkerPress?.(msg.id);
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

function WebMapFrame({ html, height, onMarkerPress }: { html: string; height: number; onMarkerPress?: (id: string) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.data?.type === 'marker-press') onMarkerPress?.(event.data.id);
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMarkerPress]);

  return (
    <iframe
      ref={ref}
      srcDoc={html}
      style={{ width: '100%', height, border: 0, borderRadius: 16 }}
      title="Carte CREW"
    />
  );
}

function MissingKeyNotice() {
  return (
    <Text style={{ textAlign: 'center', padding: 16, color: '#6B6F80' }}>
      Carte indisponible : clé TomTom manquante (EXPO_PUBLIC_TOMTOM_API_KEY).
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden' },
  webview: { flex: 1 },
  fallback: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F5F5F8' },
});
