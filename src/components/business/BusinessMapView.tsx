"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * מפה מבוססת OpenStreetMap — בלי מפתח API ובלי חיוב, בניגוד ל-Google
 * Maps. סביר לגמרי כתחליף בהמשך אם ירצו את הפוליש/ה-Street View
 * של גוגל, אבל לא נדרש כדי שהמפה תעבוד.
 *
 * תיקון האייקון: התמונות שהחבילה מצפה להן לא נטענות נכון תחת
 * Webpack/Turbopack (הנתיבים היחסיים ב-CSS לא תואמים את הבאנדל),
 * ולכן מצביעים ידנית ל-CDN במקום.
 */
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  address?: string | null;
}

export function BusinessMapView({ latitude, longitude, name, address }: Props) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-ink-200/70">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <strong>{name}</strong>
            {address && <><br />{address}</>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
