import React from "react";
import Button from "./Button";

interface KeypadProps {
  onButtonClick: (value: string) => void;
}

const Keypad: React.FC<KeypadProps> = ({ onButtonClick }) => {
  const buttons = [
    ["C", "(", ")", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
    ["sin", "cos", "tan"],
    ["π", "e", "%", "^"],
    ["log", "ln", "√", "!"]
  ];

  return (
    <div className="calculator-keypad">
      {buttons.map((row, rowIndex) => (
        <div key={rowIndex} className="keypad-row">
          {row.map((button) => (
            <Button 
              key={button} 
              label={button} 
              onClick={() => onButtonClick(button)}
              className={button === "=" ? "equals-button" : ""}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keypad;
