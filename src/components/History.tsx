import React from "react";

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: Date;
}

interface HistoryProps {
  history: HistoryItem[];
  onSelectHistory: (expression: string) => void;
  onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onSelectHistory, onClearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="history-panel">
        <div className="history-header">
          <h3>计算历史</h3>
          <button className="clear-history-button" disabled>清空历史</button>
        </div>
        <div className="no-history">暂无历史记录</div>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>计算历史</h3>
        <button className="clear-history-button" onClick={onClearHistory}>清空历史</button>
      </div>
      <div className="history-list">
        {history.map((item, index) => (
          <div key={index} className="history-item" onClick={() => onSelectHistory(item.expression)}>
            <div className="history-expression">{item.expression}</div>
            <div className="history-result">= {item.result}</div>
            <div className="history-time">
              {item.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
