import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Registros.css'; // Asegúrate de tener este archivo con los estilos sugeridos

const Registros = () => {
  const [registros, setRegistros] = useState([]);
  const [buses, setBuses] = useState([]);
  const [aparcaderos, setAparcaderos] = useState([]);
  const [filtros, setFiltros] = useState({
    bus: '',
    aparcadero: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [busesRes, aparcaderosRes, registrosRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/buses'),
          axios.get('http://127.0.0.1:8000/aparcamientos'),
          axios.get('http://127.0.0.1:8000/registros')
        ]);

        setBuses(busesRes.data);
        setAparcaderos(aparcaderosRes.data);
        setRegistros(registrosRes.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    setPaginaActual(1); // Reiniciar a la primera página si cambian filtros
  };

  const limpiarFiltros = () => {
    setFiltros({
      bus: '',
      aparcadero: '',
      fechaInicio: '',
      fechaFin: ''
    });
    setPaginaActual(1);
  };

  const registrosFiltrados = registros.filter(registro => {
    const cumpleBus = !filtros.bus || registro.bus_id === parseInt(filtros.bus);
    const cumpleAparcadero = !filtros.aparcadero || registro.aparcadero_id === parseInt(filtros.aparcadero);

    let cumpleFecha = true;
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio);
      const fechaRegistro = new Date(registro.hora_llegada);
      cumpleFecha = cumpleFecha && fechaRegistro >= fechaInicio;
    }
    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin);
      const fechaRegistro = new Date(registro.hora_llegada);
      cumpleFecha = cumpleFecha && fechaRegistro <= fechaFin;
    }

    return cumpleBus && cumpleAparcadero && cumpleFecha;
  });

  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina);

  const registrosPaginados = registrosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const getPlacaById = (id) => {
    const bus = buses.find(b => b.id === id);
    return bus ? bus.placa : `Bus ID ${id}`;
  };

  const getAparcaderoNombreById = (id) => {
    const ap = aparcaderos.find(a => a.id === id);
    return ap ? ap.municipio : `Aparcadero ID ${id}`;
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString();
  };

  if (cargando) {
    return <div className="cargando">Cargando datos...</div>;
  }

  return (
    <div className="registros-container">
      <div className="filtros-container">
        <div className="filtro-group">
          <label htmlFor="bus">Filtrar por Bus:</label>
          <select
            id="bus"
            name="bus"
            value={filtros.bus}
            onChange={handleFiltroChange}
          >
            <option value="">Todos los buses</option>
            {buses.map(bus => (
              <option key={bus.id} value={bus.id}>{bus.placa}</option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="aparcadero">Filtrar por Aparcadero:</label>
          <select
            id="aparcadero"
            name="aparcadero"
            value={filtros.aparcadero}
            onChange={handleFiltroChange}
          >
            <option value="">Todos los aparcaderos</option>
            {aparcaderos.map(ap => (
              <option key={ap.id} value={ap.id}>{ap.municipio}</option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="fechaInicio">Desde:</label>
          <input
            type="datetime-local"
            id="fechaInicio"
            name="fechaInicio"
            value={filtros.fechaInicio}
            onChange={handleFiltroChange}
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="fechaFin">Hasta:</label>
          <input
            type="datetime-local"
            id="fechaFin"
            name="fechaFin"
            value={filtros.fechaFin}
            onChange={handleFiltroChange}
          />
        </div>

        <button onClick={limpiarFiltros} className="btn-limpiar">
          Limpiar Filtros
        </button>
      </div>

      <div className="table-wrapper">
        <table className="fl-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bus (Placa)</th>
              <th>Aparcadero</th>
              <th>Hora Llegada</th>
              <th>Hora Salida</th>
              <th>Destino</th>
            </tr>
          </thead>
          <tbody>
            {registrosPaginados.length > 0 ? (
              registrosPaginados.map(registro => (
                <tr key={registro.id}>
                  <td>{registro.id}</td>
                  <td>{getPlacaById(registro.bus_id)}</td>
                  <td>{getAparcaderoNombreById(registro.aparcadero_id)}</td>
                  <td>{formatearFecha(registro.hora_llegada)}</td>
                  <td>{formatearFecha(registro.hora_salida)}</td>
                  <td>{registro.destino}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="sin-resultados">
                  No se encontraron registros con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="paginacion">
        <button
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span>Página {paginaActual} de {totalPaginas}</span>
        <button
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Registros;
