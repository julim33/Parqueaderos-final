import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VistaBuses.css'; // Asegúrate de tener un archivo de estilos CSS con este nombre

const VistaBuses = ({ onBusClick, selectedBus }) => {
  const [buses, setBuses] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/buses')
      .then(response => {
        setBuses(response.data);
        setCargando(false);
      })
      .catch(error => {
        console.error('Hubo un error al obtener los buses!', error);
        setCargando(false);
      });
  }, []);

  const formatCoordenadas = (coordenadas) => {
    if (!coordenadas) return 'No especificadas';
    try {
      const parsed = JSON.parse(coordenadas);
      if (parsed.type === 'Point' && parsed.coordinates) {
        const [longitud, latitud] = parsed.coordinates;
        return `Lat: ${latitud.toFixed(6)}, Lon: ${longitud.toFixed(6)}`;
      }
      return 'Formato no válido';
    } catch (e) {
      return 'Formato inválido';
    }
  };

  if (cargando) {
    return <div className="cargando">Cargando buses...</div>;
  }

  return (
    <div className="buses-container">
      <div className="grid-buses">
        {buses.map(bus => (
          <div
            key={bus.id}
            className={`tarjeta-bus ${selectedBus?.id === bus.id ? 'seleccionado' : ''}`}
            onClick={() => {
              if (typeof onBusClick === 'function') {
                onBusClick(bus);
              }
            }}
          >
            <div className="imagen-container">
              <img 
                src={`/img/buses/${bus.id}.jpg`} 
                alt={`Bus ${bus.placa}`}
                className="imagen-bus"
                onError={(e) => {
                  e.target.src = '/img/buses/default.jpg'; // Imagen por defecto si no existe
                }}
              />
              <div className="destino-badge">
                Destino: {bus.destino}
              </div>
            </div>
            
            <div className="info-bus">
              <h3>{bus.placa}</h3>
              <div className="detalle-bus coordenadas">
                <span className="etiqueta">Ubicación:</span>
                <span className="valor">
                  {formatCoordenadas(bus.coordenadas)}
                </span>
              </div>
              {bus.hora_llegada && (
                <div className="detalle-bus">
                  <span className="etiqueta">Hora de llegada:</span>
                  <span className="valor">{bus.hora_llegada}</span>
                </div>
              )}
              {bus.hora_salida && (
                <div className="detalle-bus">
                  <span className="etiqueta">Hora de salida:</span>
                  <span className="valor">{bus.hora_salida}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VistaBuses;
