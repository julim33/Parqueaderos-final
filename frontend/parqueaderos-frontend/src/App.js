import React, { useState } from 'react';
import Mapa from './components/Mapa';
import Registros from './components/Registros';
import RegistrarBus from './components/RegistrarBus';
import Aparcaderos from './components/Aparcaderos';
import VistaBuses from './components/VistaBuses';
import './App.css';

function App() {
  const [selectedAparcadero, setSelectedAparcadero] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null); // Nuevo estado
  const [view, setView] = useState('mapa');

  const handleAparcaderoClick = (aparcadero) => {
    setSelectedAparcadero(aparcadero);
  };

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
  };

  const handleViewChange = (viewName) => {
    setView(viewName);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Sistema de Gestión de Terminales Intermunicipales</h1>
          <p className="app-subtitle">Monitoreo y control de buses y parqueaderos</p>
        </div>
      </header>

      {/* Barra de Navegación */}
      <nav className="topbar">
        <div className="topbar-item" onClick={() => handleViewChange('mapa')}>Vista de Mapa</div>
        <div className="topbar-item" onClick={() => handleViewChange('aparacaderos')}>Terminales</div>
        <div className="topbar-item" onClick={() => handleViewChange('buses')}>Buses</div>
        <div className="topbar-item" onClick={() => handleViewChange('registros')}>Registros</div>
        <div className="topbar-item" onClick={() => handleViewChange('registrarBus')}>Registrar Viaje</div>
      </nav>

      <main className="app-content">
        {view === 'mapa' && (
          <section className="mapa-section">
            <h2 className="section-title">Mapa Interactivo</h2>
            <div className="section-content">
              <Mapa 
                selectedAparcadero={selectedAparcadero}
                onAparcaderoClick={handleAparcaderoClick}
              />
            </div>
          </section>
        )}

        {view === 'aparacaderos' && (
          <section className="mapa-section">
            <h2 className="section-title">Terminales de transporte</h2>
            <div className="section-content">
              <Aparcaderos 
                selectedAparcadero={selectedAparcadero}
                onAparcaderoClick={handleAparcaderoClick}
              />
            </div>
          </section>
        )}

        {view === 'buses' && (
          <section className="buses-section">
            <h2 className="section-title">Lista de Buses</h2>
            <div className="section-content">
              <VistaBuses 
                onBusClick={handleBusClick}
                selectedBus={selectedBus}
              />
            </div>
          </section>
        )}

        {view === 'registros' && (
          <section className="registros-section">
            <h2 className="section-title">Registros de Viajes</h2>
            <div className="section-content">
              <Registros />
            </div>
          </section>
        )}

        {view === 'registrarBus' && (
          <section className="registrar-section">
            <h2 className="section-title">Registro de Viajes</h2>
            <div className="section-content">
              <RegistrarBus />
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Sistema de Terminales Intermunicipales</p>
      </footer>
    </div>
  );
}

export default App;
