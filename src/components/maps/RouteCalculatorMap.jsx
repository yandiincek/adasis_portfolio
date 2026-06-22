import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Komponen untuk menangani klik pada peta
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const RouteCalculatorMap = ({ onDistanceCalculated, onClose }) => {
  const [waypoints, setWaypoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const [isStraightLineMode, setIsStraightLineMode] = useState(true); // Default mode garis lurus untuk jalan tambang
  const routingControlRef = useRef(null);
  const mapRef = useRef(null);

  // Pusat awal peta (Bisa disesuaikan ke area tambang default)
  const defaultCenter = [-3.316694, 114.590111]; // Banjarmasin/Kalsel as default example

  const handleMapClick = (latlng) => {
    setWaypoints(prev => [...prev, latlng]);
  };

  // Mendapatkan lokasi user saat komponen pertama kali dimuat
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14);
          }
        },
        (error) => {
          console.warn("Gagal mendapatkan lokasi GPS:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    if (waypoints.length > 1 && mapRef.current) {
      if (isStraightLineMode) {
        // --- MODE GARIS LURUS MANUAL ---
        // Bersihkan rute otomatis jika ada
        if (routingControlRef.current) {
          try {
            mapRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
          } catch (e) { console.error(e); }
        }

        // Hitung jarak manual point to point
        let totalMeters = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
          const p1 = L.latLng(waypoints[i].lat, waypoints[i].lng);
          const p2 = L.latLng(waypoints[i+1].lat, waypoints[i+1].lng);
          totalMeters += p1.distanceTo(p2);
        }
        setDistance(parseFloat((totalMeters / 1000).toFixed(2)));

      } else {
        // --- MODE JALAN UMUM (AUTO ROUTING) ---
        const map = mapRef.current;
        if (routingControlRef.current) {
          map.removeControl(routingControlRef.current);
        }

        const routeWaypoints = waypoints.map(wp => L.latLng(wp.lat, wp.lng));

        routingControlRef.current = L.Routing.control({
          waypoints: routeWaypoints,
          routeWhileDragging: true,
          show: false, // Sembunyikan panel instruksi jalan
          addWaypoints: false,
          fitSelectedRoutes: true,
          lineOptions: {
            styles: [{ color: '#E58032', opacity: 0.8, weight: 6 }]
          }
        }).addTo(map);

        routingControlRef.current.on('routesfound', function(e) {
          const routes = e.routes;
          const summary = routes[0].summary;
          const totalDistanceKm = (summary.totalDistance / 1000).toFixed(2);
          setDistance(parseFloat(totalDistanceKm));
        });
      }
    } else {
      setDistance(0);
      if (routingControlRef.current && mapRef.current) {
        try {
          mapRef.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          console.error(e);
        }
      }
    }

    return () => {
      if (routingControlRef.current && mapRef.current) {
        try {
          mapRef.current.removeControl(routingControlRef.current);
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [waypoints, isStraightLineMode]);

  const handleApply = () => {
    if (distance > 0) {
      onDistanceCalculated(distance);
    }
  };

  const handleRoundTrip = () => {
    if (waypoints.length >= 2) {
      setWaypoints(prev => [...prev, prev[0]]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-[#052334] flex items-center gap-2">
              <span className="text-xl">📍</span> Kalkulator Jarak Rute (GPS)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Klik pada peta untuk menambahkan titik rute secara berurutan. Gunakan <b>Mode Garis Lurus</b> untuk jalan tambang.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toolbar Mode */}
        <div className="px-6 py-2 bg-white flex items-center gap-4 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode Perhitungan:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setIsStraightLineMode(true)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isStraightLineMode ? 'bg-white shadow-sm text-[#052334]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📏 Garis Lurus (Tambang)
            </button>
            <button 
              onClick={() => setIsStraightLineMode(false)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isStraightLineMode ? 'bg-white shadow-sm text-[#052334]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              🚗 Auto Rute (Jalan Umum)
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div className="h-[400px] w-full relative">
          <MapContainer 
            center={defaultCenter} 
            zoom={12} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={['mt0','mt1','mt2','mt3']}
              maxZoom={20}
            />
            <MapEvents onMapClick={handleMapClick} />
            
            {/* Tampilkan Markers untuk setiap titik jika mode lurus atau baru 1 titik */}
            {(isStraightLineMode || waypoints.length === 1) && waypoints.map((wp, i) => (
              <Marker key={i} position={wp}>
                <Popup>{i === 0 ? "Titik Awal" : i === waypoints.length - 1 ? "Titik Akhir" : `Titik ${i+1}`}</Popup>
              </Marker>
            ))}

            {/* Gambar polyline manual jika mode lurus */}
            {isStraightLineMode && waypoints.length > 1 && (
              <Polyline positions={waypoints} color="#E58032" weight={6} opacity={0.8} />
            )}
          </MapContainer>
        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 block mb-0.5 font-bold uppercase tracking-wider">Total Jarak</span>
              <span className="text-lg font-black text-[#E58032]">{distance} KM</span>
            </div>
            {waypoints.length < 2 && (
              <div className="flex items-center text-sm font-medium text-slate-500">
                {waypoints.length === 0 ? "Klik peta untuk Titik Awal..." : "Klik peta untuk Titik Tujuan..."}
              </div>
            )}
            {waypoints.length >= 2 && (
              <div className="flex items-center">
                <button 
                  onClick={handleRoundTrip}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  🔄 Jadikan Bolak-Balik
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setWaypoints([]);
                setDistance(0);
                if (routingControlRef.current && mapRef.current) {
                  try {
                    mapRef.current.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                  } catch (e) {}
                }
              }}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Reset Peta
            </button>
            <button 
              onClick={handleApply}
              disabled={distance <= 0}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                distance > 0 
                  ? "bg-[#E58032] text-white hover:bg-[#d9772b] hover:shadow-md" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Gunakan Jarak Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteCalculatorMap;
