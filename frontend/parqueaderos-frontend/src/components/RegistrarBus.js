import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RegistrarBus = () => {
  const [formData, setFormData] = useState({
    busId: '',
    aparcaderoId: '',
    destino: '',
    horaSalida: ''
  });
  
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [buses, setBuses] = useState([]);
  const [aparcaderos, setAparcaderos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [busesResponse, aparcaderosResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/buses'),
          axios.get('http://127.0.0.1:8000/aparcamientos')
        ]);
        setBuses(busesResponse.data);
        setAparcaderos(aparcaderosResponse.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setMensaje({
          texto: 'Error al cargar los datos iniciales',
          tipo: 'error'
        });
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Si cambia el aparcadero, actualizamos el destino automáticamente
      if (name === 'aparcaderoId' && value) {
        const aparcaderoSeleccionado = aparcaderos.find(ap => ap.id === parseInt(value));
        if (aparcaderoSeleccionado) {
          newData.destino = aparcaderoSeleccionado.municipio;
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Formatear la hora de salida correctamente para el backend
      let horaSalidaFormateada = formData.horaSalida 
        ? new Date(formData.horaSalida).toISOString()
        : null;

      const registroData = {
        bus_id: parseInt(formData.busId),
        aparcadero_id: parseInt(formData.aparcaderoId),
        destino: formData.destino,
        hora_salida: horaSalidaFormateada
      };

      console.log('Datos enviados:', registroData);

      const response = await axios.post('http://127.0.0.1:8000/registros', registroData);

      setMensaje({
        texto: response.data.mensaje || 'Registro exitoso',
        tipo: 'exito'
      });
      
      // Resetear formulario
      setFormData({
        busId: '',
        aparcaderoId: '',
        destino: '',
        horaSalida: ''
      });
    } catch (error) {
      console.error('Error registrando bus:', error);
      setMensaje({
        texto: error.response?.data?.detail || 'Error al registrar el bus',
        tipo: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {mensaje.texto && (
        <div style={{
          ...styles.message,
          ...(mensaje.tipo === 'exito' ? styles.success : styles.error)
        }}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="busId" style={styles.label}>Seleccione un Bus:</label>
          <select
            id="busId"
            name="busId"
            value={formData.busId}
            onChange={handleChange}
            required
            style={styles.select}
          >
            <option value="">-- Seleccione --</option>
            {buses.map(bus => (
              <option key={bus.id} value={bus.id}>
                {bus.placa}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="aparcaderoId" style={styles.label}>Seleccione un Aparcadero:</label>
          <select
            id="aparcaderoId"
            name="aparcaderoId"
            value={formData.aparcaderoId}
            onChange={handleChange}
            required
            style={styles.select}
          >
            <option value="">-- Seleccione --</option>
            {aparcaderos.map(ap => (
              <option key={ap.id} value={ap.id}>
                {ap.municipio}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="destino" style={styles.label}>Destino:</label>
          <input
            type="text"
            id="destino"
            name="destino"
            value={formData.destino}
            onChange={handleChange}
            required
            readOnly
            style={{...styles.input, backgroundColor: '#f0f0f0', cursor: 'not-allowed'}}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="horaSalida" style={styles.label}>Hora de Salida (opcional):</label>
          <input
            type="datetime-local"
            id="horaSalida"
            name="horaSalida"
            value={formData.horaSalida}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          style={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </div>
  );
};

// Estilos en objeto JavaScript
const styles = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '1.5rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontWeight: '500',
    color: '#555'
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  submitButton: {
    padding: '0.75rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed'
  },
  message: {
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    textAlign: 'center'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  }
};

export default RegistrarBus;