import React, { useState } from "react";
import Display from "./Display";
import Keypad from "./Keypad";
import History, { HistoryItem } from "./History";
import "../styles/Calculator.css";
import Decimal from "decimal.js";

interface CalculatorProps {
  isVisible: boolean;
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ isVisible, onClose }) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 计算阶乘的函数
  const factorial = (n: number): number => {
    if (n < 0) throw new Error("负数没有阶乘");
    if (n === 0 || n === 1) return 1;
    if (n > 170) throw new Error("阶乘太大，无法计算");

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // 增强的校验公式合法性
  const validateExpression = (expr: string): { valid: boolean; message: string } => {
    if (!expr.trim()) {
      return { valid: false, message: "请输入计算公式" };
    }

    // 检查特殊常数后面直接跟数字的情况 (如 π2222 或 e123)
    if (/[πe]\d+/.test(expr)) {
      return {
        valid: false,
        message: "表达式错误：特殊常数（π或e）后直接跟数字。请使用乘号，例如：π×123"
      };
    }

    // 检查括号匹配
    let bracketCount = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === "(") bracketCount++;
      if (expr[i] === ")") bracketCount--;
      if (bracketCount < 0) {
        return { valid: false, message: "括号不匹配：右括号过多" };
      }
    }
    if (bracketCount > 0) {
      return { valid: false, message: "括号不匹配：左括号过多" };
    }

    // 检查连续操作符 (排除阶乘符号)
    if (/[+\-×÷^]{2,}/.test(expr)) {
      return { valid: false, message: "表达式错误：存在连续运算符" };
    }

    // 检查以操作符结尾 (除了阶乘)
    if (/[+\-×÷^]$/.test(expr)) {
      return { valid: false, message: "表达式错误：以运算符结尾" };
    }

    // 检查阶乘符号是否使用正确 (只能跟在数字或右括号后面)
    if (/![^)]/.test(expr) && !/\d!/.test(expr)) {
      return { valid: false, message: "阶乘符号使用错误：! 只能跟在数字或右括号后面" };
    }

    // 检查除以零
    if (/÷\s*0(?![\d.])/.test(expr)) {
      return { valid: false, message: "数学错误：不能除以零" };
    }

    // 检查函数后是否有左括号
    const functionNames = ["sin", "cos", "tan", "log", "ln", "√"];
    for (const func of functionNames) {
      if (expr.includes(func) && !expr.includes(func + "(")) {
        return {
          valid: false,
          message: `函数使用错误：${func} 后必须跟左括号，例如：${func}(90)`
        };
      }
    }

    // 检查数字格式
    if (/\d+\.\d+\.\d+/.test(expr)) {
      return { valid: false, message: "数字格式错误：多个小数点" };
    }

    return { valid: true, message: "" };
  };

  // 处理阶乘符号的函数
  const processFactorials = (expr: string): string => {
    // 找出所有的数字后面跟着感叹号的模式
    const regex = /(\d+)!|\)!/g;
    return expr.replace(regex, (match, number) => {
      if (match === ")!") {
        // 这种情况需要在计算中处理
        return match;
      }
      // 计算数字的阶乘
      try {
        const num = parseInt(number, 10);
        return factorial(num).toString();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error("阶乘计算错误: " + error.message);
        }
        throw error;
      }
    });
  };

  // 改进的计算函数
  const evaluate = (expr: string): string => {
    try {
      if (!expr.trim()) return "";

      // 预处理阶乘
      let processedExpr = expr;

      // 处理简单的阶乘情况
      if (processedExpr.includes("!")) {
        processedExpr = processFactorials(processedExpr);
      }

      // 处理百分号 - 将 x% 转换为 x/100
      processedExpr = processedExpr.replace(/(\d+\.?\d*)%/g, function (match, number) {
        return `(${number}/100)`;
      });

      // 替换显示符号为JavaScript可计算的符号
      processedExpr = processedExpr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**")
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString());

      // 处理三角函数（默认使用弧度）
      processedExpr = processedExpr
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/√\(/g, "Math.sqrt(");

      // eslint-disable-next-line
      const result = new Function("return " + processedExpr)();

      // 检查计算结果是否为有效数字
      if (isNaN(result) || !isFinite(result)) {
        throw new Error("计算结果不是有效数字");
      }

      return new Decimal(result).toString();
    } catch (error) {
      console.error("计算错误:", error);
      throw error;
    }
  };

  // 计算结果并添加到历史记录的函数
  const calculateResult = () => {
    // 清除之前的错误
    setError(null);

    // 校验表达式
    const validation = validateExpression(expression);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      const calculatedResult = evaluate(expression);
      setResult(calculatedResult);

      // 添加到历史记录
      const newHistoryItem: HistoryItem = {
        expression,
        result: calculatedResult,
        timestamp: new Date()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (error) {
      if (error instanceof Error) {
        setError("计算错误: " + (error.message || "未知错误"));
      } else {
        setError("计算过程中出现错误");
      }
      setResult("");
    }
  };

  const handleButtonClick = (value: string) => {
    // 清除错误提示
    if (error) setError(null);

    switch (value) {
      case "C":
        setExpression("");
        setResult("");
        setError(null);
        break;
      case "=":
        calculateResult();
        break;
      case "HISTORY":
        setShowHistory(!showHistory);
        break;
      case "π":
        setExpression(prev => prev + "π");
        break;
      case "e":
        setExpression(prev => prev + "e");
        break;
      case "sin":
      case "cos":
      case "tan":
      case "log":
      case "ln":
      case "√":
        setExpression(prev => prev + value + "(");
        break;
      default:
        setExpression(prev => prev + value);
        break;
    }
  };

  const handleExpressionChange = (value: string) => {
    setExpression(value);
    // 当用户修改输入时，清除错误提示和结果
    if (error) setError(null);
    // 当用户修改输入时，清除结果
    if (result) setResult("");
  };

  const handleSelectHistory = (expr: string) => {
    setExpression(expr);
    setShowHistory(false);
    setError(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  if (!isVisible) return null;

  return (
    <div className="calculator-modal">
      <div className="calculator-modal-content">
        <div className="calculator">
          <div className="calculator-tabs">
            <button
              className={`tab-button ${!showHistory ? "active" : ""}`}
              onClick={() => setShowHistory(false)}
            >
              计算器
            </button>
            <button
              className={`tab-button ${showHistory ? "active" : ""}`}
              onClick={() => setShowHistory(true)}
            >
              历史记录
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          {showHistory ? (
            <History
              history={history}
              onSelectHistory={handleSelectHistory}
              onClearHistory={handleClearHistory}
            />
          ) : (
            <>
              <Display
                expression={expression}
                result={result}
                error={error}
                onExpressionChange={handleExpressionChange}
                onCalculate={calculateResult}
              />
              <Keypad onButtonClick={handleButtonClick} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
