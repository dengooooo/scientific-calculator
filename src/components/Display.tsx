import React from "react";

interface DisplayProps {
  expression: string;
  result: string;
  error: string | null;
  onExpressionChange: (value: string) => void;
  onCalculate: () => void;
}

const Display: React.FC<DisplayProps> = ({ 
  expression, 
  result, 
  error,
  onExpressionChange,
  onCalculate
}) => {
  // 添加键盘事件处理函数
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 防止表单提交
      onCalculate(); // 触发计算函数
    }
  };

  return (
    <div className="calculator-display">
      <div className="expression-input">
        <input
          type="text"
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入计算公式..."
          className={`formula-input ${error ? "error-input" : ""}`}
          autoFocus
        />
      </div>
      
      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="value">{result}</div>
      )}
    </div>
  );
};

export default Display;
