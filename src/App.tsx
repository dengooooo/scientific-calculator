import React, { useState } from "react";
import Calculator from "./components/Calculator";
import "./App.css";

function App() {
  const [showCalculator, setShowCalculator] = useState(false);

  const toggleCalculator = () => {
    setShowCalculator(!showCalculator);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>科学计算器</h1>
      </header>
      <main>
        <button 
          className="toggle-calculator"
          onClick={toggleCalculator}
        >
          {showCalculator ? "隐藏计算器" : "显示计算器"}
        </button>
        
        <Calculator 
          isVisible={showCalculator} 
          onClose={() => setShowCalculator(false)} 
        />
      </main>
    </div>
  );
}

export default App;
