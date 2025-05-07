import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';

const Mapa = ({ selectedAparcadero, onAparcaderoClick }) => {
  const [aparcaderos, setAparcaderos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mostrarAparcaderos, setMostrarAparcaderos] = useState(true);  // Nuevo estado para alternar la vista
  const mapRef = useRef();

  // Obtener los aparcaderos
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/aparcamientos')
      .then(response => {
        setAparcaderos(response.data);
      })
      .catch(error => {
        console.error('Error al obtener los aparcaderos:', error);
      });
  }, []);

  // Obtener los buses
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/buses')
      .then(response => {
        setBuses(response.data);
      })
      .catch(error => {
        console.error('Error al obtener los buses:', error);
      });
  }, []);

  const customMarkerIcon = new L.Icon({
    iconUrl: markerIconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Icono rojo para los buses
  const busMarkerIcon = new L.Icon({
    iconUrl: '/img/rojo.png', 
    iconSize: [41, 41],
    iconAnchor: [41, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Función para asociar buses a aparcaderos por coordenadas
  const getBusesForAparcadero = (aparcadero) => {
    const coordenadasAparcadero = JSON.parse(aparcadero.coordenadas);
    const [lonAparcadero, latAparcadero] = coordenadasAparcadero.coordinates;

    // Filtra los buses que están en el mismo aparcadero (coordenadas coinciden)
    return buses.filter(bus => {
      const coordenadasBus = JSON.parse(bus.coordenadas);
      const [lonBus, latBus] = coordenadasBus.coordinates;

      // Comparar si las coordenadas coinciden
      return lonAparcadero === lonBus && latAparcadero === latBus;
    });
  };

  return (
    <div className="mapa-container">
      <div style={{ marginBottom: '10px' }}>
        {/* Botón para alternar entre la vista de aparcaderos y la de buses */}
        <button onClick={() => setMostrarAparcaderos(!mostrarAparcaderos)}>
          {mostrarAparcaderos ? 'Ver solo Buses' : 'Ver Aparcaderos y Buses'}
        </button>
      </div>

      <MapContainer
        center={[4.60971, -74.08175]}  // Posición inicial del mapa
        zoom={8}  // Zoom inicial
        style={{ height: "500px", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marcadores de aparcaderos */}
        {mostrarAparcaderos && aparcaderos.map(aparcadero => {
          try {
            const coordenadas = JSON.parse(aparcadero.coordenadas);
            const [lon, lat] = coordenadas.coordinates;

            // Obtener los buses asociados a este aparcadero
            const busesAsociados = getBusesForAparcadero(aparcadero);

            // Calcular la capacidad actual de los aparcaderos
            const capacidadActual = busesAsociados.length;

            return (
              <Marker 
                key={aparcadero.id} 
                position={[lat, lon]} 
                icon={customMarkerIcon}
                eventHandlers={{
                  click: () => onAparcaderoClick({
                    id: aparcadero.id,
                    center: [lat, lon],
                    zoom: 16
                  })
                }}
              >
                <Popup>
                  <strong>{aparcadero.municipio}</strong><br />
                  Capacidad Máxima: {aparcadero.capacidad_maxima}<br />
                  Capacidad Actual: {capacidadActual} <br />
                  <u>Buses presentes:</u>
                  <ul>
                    {busesAsociados.length > 0 ? busesAsociados.map((bus, index) => (
                      <li key={index}>
                        Placa: {bus.placa || 'Desconocida'} - Destino: {bus.destino || 'N/A'}
                      </li>
                    )) : <li>No hay buses presentes.</li>}
                  </ul>
                </Popup>
              </Marker>
            );
          } catch (e) {
            console.error("Error al procesar coordenadas:", e);
            return null;
          }
        })}

        {/* Marcadores de buses */}
        {!mostrarAparcaderos && buses.map(bus => {
          try {
            const coordenadasBus = JSON.parse(bus.coordenadas);
            const [lon, lat] = coordenadasBus.coordinates;

            return (
              <Marker 
                key={bus.id} 
                position={[lat, lon]} 
                icon={busMarkerIcon}  // Usamos el icono rojo para los buses
              >
                <Popup>
                  <strong>Placa: {bus.placa}</strong><br />
                  Destino: {bus.destino}<br />
                </Popup>
              </Marker>
            );
          } catch (e) {
            console.error("Error al procesar coordenadas del bus:", e);
            return null;
          }
        })}

      </MapContainer>
    </div>
  );
};

export default Mapa;
