'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Filter, Layers, Info } from 'lucide-react';
import type { DiagnosticCentre } from '../../lib/types';
import { districts, facilityTypes } from '../../lib/data';

interface GisMapProps {
  centres: DiagnosticCentre[];
  onSelectCentre?: (centreId: string) => void;
}

export default function GisMap({ centres, onSelectCentre }: GisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [activeCentre, setActiveCentre] = useState<DiagnosticCentre | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter centres
  const filteredCentres = centres.filter(c => {
    const matchesDistrict = selectedDistrict === 'All' || c.district === selectedDistrict;
    const matchesType = selectedType === 'All' || c.type === selectedType;
    return matchesDistrict && matchesType;
  });

  useEffect(() => {
    let isCancelled = false;

    // Load Leaflet dynamically
    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      // Add Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');

      if (isCancelled || !mapContainerRef.current) return;

      // Initialize map centered on Maharashtra
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([19.2, 75.5], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors | MahaCare GIS',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
      }

      renderMarkers(L);
    }

    initMap();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update markers when filters change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then(L => {
      renderMarkers(L);
    });
  }, [selectedDistrict, selectedType, centres]);

  function renderMarkers(L: any) {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Custom colored pin icons
    const createPin = (color: string) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
    };

    filteredCentres.forEach(c => {
      if (!c.gpsLat || !c.gpsLng) return;

      const pinColor =
        c.status === 'Approved' ? '#0d9488' :
        c.status === 'Rejected' ? '#ef4444' :
        '#f59e0b';

      const marker = L.marker([c.gpsLat, c.gpsLng], {
        icon: createPin(pinColor),
      }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <strong style="color: #1e3a5f; font-size: 13px; display: block; margin-bottom: 2px;">${c.name}</strong>
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 4px; background: ${
            c.status === 'Approved' ? '#d1fae5; color: #065f46;' : '#fef3c7; color: #92400e;'
          } margin-bottom: 6px;">${c.status}</span>
          <p style="margin: 2px 0; color: #64748b;"><strong>Type:</strong> ${c.type}</p>
          <p style="margin: 2px 0; color: #64748b;"><strong>District:</strong> ${c.district} (${c.taluka})</p>
          <p style="margin: 2px 0; font-family: monospace; color: #0d9488;">${c.udcid}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setActiveCentre(c);
      });

      markersRef.current.push(marker);
    });

    // If specific district selected, pan to first marker
    if (selectedDistrict !== 'All' && filteredCentres.length > 0) {
      const first = filteredCentres.find(c => c.gpsLat && c.gpsLng);
      if (first) {
        map.setView([first.gpsLat, first.gpsLng], 10);
      }
    } else if (filteredCentres.length > 0) {
      map.setView([19.2, 75.5], 7);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
            <Filter size={15} className="text-teal-600" /> Filters:
          </span>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="All">All Districts ({centres.length})</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="All">All Facility Types</option>
            {facilityTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> In Progress
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            Showing {filteredCentres.length} Pins
          </span>
        </div>
      </div>

      {/* Map display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs h-[520px] relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Info Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Info size={16} className="text-teal-600" /> Centre Geolocation
            </h3>

            {activeCentre ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Selected Centre</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{activeCentre.name}</h4>
                  <p className="font-mono text-teal-700">{activeCentre.udcid}</p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5">
                  <p><strong>District:</strong> {activeCentre.district} ({activeCentre.taluka})</p>
                  <p><strong>Type:</strong> {activeCentre.type}</p>
                  <p><strong>Address:</strong> {activeCentre.address}</p>
                  <p><strong>Status:</strong> <span className="font-semibold text-teal-700">{activeCentre.status}</span></p>
                  <p><strong>GPS:</strong> {activeCentre.gpsLat?.toFixed(4)}, {activeCentre.gpsLng?.toFixed(4)}</p>
                </div>

                {onSelectCentre && (
                  <button
                    onClick={() => onSelectCentre(activeCentre.id)}
                    className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors"
                  >
                    View Full File
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <MapPin size={32} className="mx-auto mb-2 text-slate-300" />
                <p>Click on any marker pin across Maharashtra to inspect centre details.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-teal-50 rounded-lg border border-teal-100 text-[11px] text-teal-800 mt-4">
            <strong>GIS Accuracy Note:</strong> All sample coordinates represent realistic medical hubs across Maharashtra districts for demonstration.
          </div>
        </div>
      </div>
    </div>
  );
}
