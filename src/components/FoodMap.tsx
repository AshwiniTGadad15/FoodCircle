import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { FoodDonation } from '../../shared/types.ts';
import { formatTimeRemaining } from '../lib/api.ts';

interface FoodMapProps {
  donations: FoodDonation[];
  center: { lat: number; lng: number };
  onSelectDonation: (donation: FoodDonation) => void;
  heightClass?: string;
}

export function FoodMap({
  donations,
  center,
  onSelectDonation,
  heightClass = 'h-[480px]',
}: FoodMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 5,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds: L.LatLngTuple[] = [];

    donations.forEach((item) => {
      if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return;
      bounds.push([item.lat, item.lng]);

      const markerIcon = L.divIcon({
        className: 'foodcircle-map-marker',
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:${
          item.dietaryType === 'Veg' ? '#16834A' : '#B91C1C'
        };border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:11px;">${
          item.availableQuantity
        }</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const remaining = formatTimeRemaining(item.bestBefore);

      // Build popup content safely via DOM nodes (never innerHTML with untrusted strings)
      const popupRoot = document.createElement('div');
      popupRoot.style.minWidth = '200px';

      const title = document.createElement('div');
      title.textContent = item.foodName;
      title.style.fontWeight = '700';
      title.style.fontSize = '13px';
      title.style.color = '#202820';
      title.style.marginBottom = '4px';

      const meta = document.createElement('div');
      meta.textContent = `${item.dietaryType} · ${item.availableQuantity} ${item.unit} · ${item.city}`;
      meta.style.fontSize = '12px';
      meta.style.color = '#526054';
      meta.style.marginBottom = '4px';

      const deadline = document.createElement('div');
      deadline.textContent = `Safe window: ${remaining.label}`;
      deadline.style.fontSize = '11px';
      deadline.style.color = remaining.urgent ? '#B45309' : '#16834A';
      deadline.style.marginBottom = '8px';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'View Details & Request';
      btn.style.background = '#16834A';
      btn.style.color = '#ffffff';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.padding = '6px 10px';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '600';
      btn.style.cursor = 'pointer';
      btn.style.width = '100%';
      btn.addEventListener('click', () => onSelectDonation(item));

      popupRoot.appendChild(title);
      popupRoot.appendChild(meta);
      popupRoot.appendChild(deadline);
      popupRoot.appendChild(btn);

      L.marker([item.lat, item.lng], { icon: markerIcon }).bindPopup(popupRoot).addTo(layerGroup);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    } else {
      map.setView([center.lat, center.lng], 5);
    }
  }, [donations, center.lat, center.lng, onSelectDonation]);

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2E8E0] bg-white">
      <div ref={containerRef} className={`w-full ${heightClass}`} />
      <div className="px-4 py-2.5 bg-[#F8FAF7] border-t border-[#E2E8E0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#526054]">
        <span>Map data via OpenStreetMap. Marker numbers indicate remaining available units.</span>
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16834A]" /> Veg Listing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" /> Non-Veg Listing
          </span>
        </span>
      </div>
    </div>
  );
}
