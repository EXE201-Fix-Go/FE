import React, { useEffect, useRef } from 'react';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  /** primary = cam (khách/vị trí bạn) · tertiary = xanh (thợ). */
  tone?: 'primary' | 'tertiary';
}

interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  /** Nếu không truyền, tự ghim tại center. */
  markers?: MapMarker[];
  /** Bán kính sai số GPS (mét) → vẽ vòng tròn quanh center. */
  accuracy?: number | null;
  className?: string;
}

const COLORS: Record<NonNullable<MapMarker['tone']>, string> = {
  primary: '#A33900',
  tertiary: '#1B7A4B',
};

/** Bản đồ Leaflet + tile OpenStreetMap, ghim đúng toạ độ thật. Leaflet lấy từ window (CDN). */
export const MapView: React.FC<MapViewProps> = ({ center, zoom = 16, markers, accuracy, className }) => {
  const elRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  const draw = () => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    if (accuracy && accuracy > 0) {
      L.circle([center.lat, center.lng], {
        radius: accuracy,
        color: COLORS.primary,
        weight: 1,
        fillColor: COLORS.primary,
        fillOpacity: 0.12,
      }).addTo(layer);
    }
    const pts: MapMarker[] =
      markers && markers.length ? markers : [{ lat: center.lat, lng: center.lng, label: 'Vị trí của bạn', tone: 'primary' }];
    pts.forEach((m) => {
      const color = COLORS[m.tone ?? 'primary'];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const mk = L.marker([m.lat, m.lng], { icon }).addTo(layer);
      if (m.label) mk.bindPopup(m.label);
    });
  };

  // Khởi tạo bản đồ 1 lần (chờ Leaflet từ CDN nếu chưa sẵn sàng).
  useEffect(() => {
    let retry = 0;
    const init = () => {
      const L = window.L;
      if (mapRef.current) return;
      if (!L || !elRef.current) {
        retry = window.setTimeout(init, 200);
        return;
      }
      const map = L.map(elRef.current, { zoomControl: true, attributionControl: true }).setView(
        [center.lat, center.lng],
        zoom
      );
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw();
      // Container có thể vừa đổi kích thước (chuyển màn) → ép Leaflet đo lại.
      window.setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 0);
    };
    init();
    return () => {
      clearTimeout(retry);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật khi center/markers/accuracy đổi.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom() || zoom);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, accuracy, JSON.stringify(markers)]);

  return <div ref={elRef} className={className ?? 'w-full h-full'} />;
};
