import React from 'react';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import Assignmenttable from './components/Assignmenttable';

const App: React.FC = () => {
  return (
    <div className="App">
      <Assignmenttable/>
    </div>
  );
};

export default App;