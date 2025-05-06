import React from 'react';
import Aparcaderos from './components/Aparcaderos';
import Registros from './components/Registros';
import RegistrarBus from './components/RegistrarBus';
import Mapa from './components/Mapa';

function App() {
  return (
    <div className="App">
      <h1>Parqueaderos Intermunicipales</h1>
      <Mapa />
      <Aparcaderos />
      <Registros />
      <RegistrarBus />
    </div>
  );
}

export default App;
