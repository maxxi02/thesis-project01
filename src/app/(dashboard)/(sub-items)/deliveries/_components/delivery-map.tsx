"use client";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  ZoomControl,
  Popup,
} from "react-leaflet";
import { Icon, type LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import type React from "react";
import { useState, useEffect, useRef } from "react";

type MapLocation = LatLngLiteral & {
  id: string;
  name?: string;
  address?: string;
  status?: string;
};

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

type MapProps = {
  center: LatLngLiteral;
  locations: MapLocation[];
  selectedLocationId?: string;
};

type SearchSuggestion = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    municipality?: string;
    province?: string;
    region?: string;
    country?: string;
  };
};

const SelectedLocation = ({
  center,
  zoom = 15,
}: {
  center: LatLngLiteral;
  zoom?: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

const DeliveryMap: React.FC<MapProps> = ({
  center,
  locations,
  selectedLocationId,
}) => {
  const [mapType, setMapType] = useState<MapType>("roadmap");
  const [selectedLocation, setSelectedLocation] = useState<
    MapLocation | undefined
  >();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streetViewUrl, setStreetViewUrl] = useState<string>("");
  const [showStreetView, setShowStreetView] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedLocationId) {
      const location = locations.find((l) => l.id === selectedLocationId);
      if (location) {
        setSelectedLocation(location);
      }
    }
  }, [selectedLocationId, locations]);

  const getMarkerIcon = (location: MapLocation, isSelected: boolean) => {
    const getColor = () => {
      if (isSelected) return "#EF4444";
      switch (location.status) {
        case "pending":
          return "#F59E0B";
        case "in-transit":
          return "#3B82F6";
        case "delivered":
          return "#10B981";
        default:
          return "#6B7280";
      }
    };

    return new Icon({
      iconUrl:
        "data:image/svg+xml;base64," +
        btoa(`
        <svg width="${isSelected ? "30" : "25"}" height="${
          isSelected ? "49" : "41"
        }" viewBox="0 0 ${isSelected ? "30" : "25"} ${
          isSelected ? "49" : "41"
        }" xmlns="http://www.w3.org/2000/svg">
          <path d="${
            isSelected
              ? "M15 0C6.716 0 0 6.716 0 15c0 15 15 34 15 34s15-19 15-34C30 6.716 23.284 0 15 0z"
              : "M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z"
          }" fill="${getColor()}"/>
          <circle cx="${isSelected ? "15" : "12.5"}" cy="${
          isSelected ? "15" : "12.5"
        }" r="${isSelected ? "6" : "5"}" fill="white"/>
        </svg>
      `),
      iconSize: isSelected ? [30, 49] : [25, 41],
      iconAnchor: isSelected ? [15, 49] : [12, 41],
    });
  };

  const getUrl = () => {
    const mapTypeUrls: Record<MapType, string> = {
      roadmap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      hybrid:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      terrain:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    };
    return mapTypeUrls[mapType];
  };

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=ph&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocations(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const newLocation: MapLocation = {
      id: suggestion.place_id,
      lat: Number.parseFloat(suggestion.lat),
      lng: Number.parseFloat(suggestion.lon),
      name: suggestion.display_name,
      address: suggestion.display_name,
    };
    setSelectedLocation(newLocation);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  const openStreetView = (location: MapLocation) => {
    const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`;
    setStreetViewUrl(streetViewUrl);
    setShowStreetView(true);
  };

  const renderMarks = () => {
    // Filter to show only in-transit deliveries
    const activeLocations = locations.filter(
      (location) => location.status === "in-transit"
    );

    return activeLocations.map((location) => (
      <Marker
        key={location.id}
        icon={getMarkerIcon(
          location,
          location.id === selectedLocation?.id ||
            location.id === selectedLocationId
        )}
        position={{ lat: location.lat, lng: location.lng }}
        eventHandlers={{
          click: () => {
            setSelectedLocation(location);
          },
        }}
      >
        <Popup>
          <div style={{ minWidth: "200px" }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {location.name || `Location ${location.id}`}
            </h3>
            {location.status && (
              <div style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#DBEAFE",
                    color: "#1E40AF",
                  }}
                >
                  IN TRANSIT
                </span>
              </div>
            )}
            {location.address && (
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}
              >
                {location.address}
              </p>
            )}
            <p style={{ margin: "0 0 8px 0", fontSize: "12px" }}>
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
            <button
              onClick={() => openStreetView(location)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Street View
            </button>
          </div>
        </Popup>
      </Marker>
    ));
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          width: "300px",
        }}
      >
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location (e.g., Malvar, San Poquinto, Block 3)"
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              border: "2px solid #E5E7EB",
              borderRadius: "8px",
              outline: "none",
              backgroundColor: "white",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {isLoading && (
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              Searching...
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                marginTop: "4px",
                maxHeight: "300px",
                overflowY: "auto",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #F3F4F6",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <div style={{ fontWeight: "500", marginBottom: "2px" }}>
                    {suggestion.display_name.split(",")[0]}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    {suggestion.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          gap: "8px",
        }}
      >
        {(["roadmap", "satellite", "hybrid", "terrain"] as MapType[]).map(
          (type) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              style={{
                padding: "8px 12px",
                backgroundColor: mapType === type ? "#3B82F6" : "white",
                color: mapType === type ? "white" : "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                textTransform: "capitalize",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {type}
            </button>
          )
        )}
      </div>

      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "0px",
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={selectedLocation || center}
          zoom={13}
          minZoom={5}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer url={getUrl()} />
          {(selectedLocation || selectedLocationId) && (
            <SelectedLocation
              center={
                selectedLocation ||
                locations.find((l) => l.id === selectedLocationId)!
              }
              zoom={15}
            />
          )}
          {renderMarks()}
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>

      {showStreetView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "90%",
              height: "90%",
              backgroundColor: "white",
              borderRadius: "8px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowStreetView(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 2001,
                padding: "8px 12px",
                backgroundColor: "#EF4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <iframe
              src={streetViewUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "8px",
              }}
              title="Street View"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
