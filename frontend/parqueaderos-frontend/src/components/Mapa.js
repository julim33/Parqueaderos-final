import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Aparcaderos.css';

const Aparcaderos = ({ onAparcaderoClick }) => {
  const [aparcaderos, setAparcaderos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/aparcamientos')
      .then(response => {
        setAparcaderos(response.data);
        setCargando(false);
      })
      .catch(error => {
        console.error('Hubo un error al obtener los aparcamientos!', error);
        setCargando(false);
      });
  }, []);

  const formatCoordenadas = (coordenadas) => {
    if (!coordenadas) return 'No especificadas';
    
    try {
      const parsed = JSON.parse(coordenadas);
      if (parsed.type === 'Point' && parsed.coordinates) {
        const [lon, lat] = parsed.coordinates;
        return `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
      }
      return 'Formato no válido';
    } catch (e) {
      return 'Formato inválido';
    }
  };

  const handleAparcaderoClick = (aparcadero) => {
    try {
      const coordenadas = JSON.parse(aparcadero.coordenadas);
      const [lon, lat] = coordenadas.coordinates;
      
      if (onAparcaderoClick) {
        onAparcaderoClick({
          id: aparcadero.id,
          center: [lat, lon],
          zoom: 16
        });
      }
    } catch (e) {
      console.error("Error al procesar coordenadas:", e);
    }
  };

  if (cargando) {
    return <div className="cargando">Cargando terminales...</div>;
  }

  return (
    <div className="aparcaderos-container">
      <h2 className="titulo-aparcaderos">Terminales de Transporte</h2>
      
      <div className="grid-aparcaderos">
        {aparcaderos.map(aparcadero => (
          <div 
            key={aparcadero.id} 
            className="tarjeta-aparcadero"
            onClick={() => handleAparcaderoClick(aparcadero)}
          >
            <div className="imagen-container">
              <img 
                src={`/img/aparcaderos/${aparcadero.id}.jpg`} 
                alt={`Terminal ${aparcadero.municipio}`}
                className="imagen-aparcadero"
                onError={(e) => {
                  e.target.src = '/img/aparcaderos/default.jpg';
                }}
              />
              <div className="capacidad-badge">
                {aparcadero.capacidad_maxima} buses
              </div>
            </div>
            
            <div className="info-aparcadero">
              <h3>{aparcadero.municipio}</h3>
              
              <div className="detalle-aparcadero coordenadas">
                <span className="etiqueta">Ubicación:</span>
                <span className="valor">
                  {formatCoordenadas(aparcadero.coordenadas)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Aparcaderos;