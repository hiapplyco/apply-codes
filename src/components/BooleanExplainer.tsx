import React from 'react';
import { BooleanExplanation } from '@/types/boolean-explanation';
import './BooleanExplainer.css';

interface BooleanExplainerProps {
  explanation: BooleanExplanation;
  onClose?: () => void;
}

const BooleanExplainer: React.FC<BooleanExplainerProps> = ({ explanation, onClose }) => {
  return (
    <div className="boolean-explainer">
      {onClose && (
        <button onClick={onClose} className="close-button">
          ×
        </button>
      )}
      
      {/* Summary */}
      <div className="summary-box">
        <h3>🎯 What This Search Finds</h3>
        <p>{explanation.summary}</p>
      </div>

      {/* Primary Target */}
      <div className="primary-target-box">
        <h4>🔍 Primary Target</h4>
        <p>{explanation.structure.primaryTarget}</p>
      </div>

      {/* Visual Breakdown */}
      <div className="breakdown-container">
        <h4>Search Components</h4>
        {explanation.structure.breakdown.map((item, idx) => (
          <div key={idx} className={`component-box ${item.visual}`}>
            <div className="operator-badge">{item.operator}</div>
            <div className="component-text">{item.component}</div>
            <div className="meaning">{item.meaning}</div>
            {item.examples.length > 0 && (
              <div className="examples">
                Examples: {item.examples.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Location Logic */}
      {explanation.locationLogic.areas.length > 0 && (
        <div className="location-box">
          <h4>📍 Location Coverage</h4>
          <div className="location-chips">
            {explanation.locationLogic.areas.map((loc, idx) => (
              <span key={idx} className="location-chip">{loc}</span>
            ))}
          </div>
          <p className="location-reason">{explanation.locationLogic.explanation}</p>
        </div>
      )}

      {/* Exclusions */}
      {explanation.exclusions.terms.length > 0 && (
        <div className="exclusions-box">
          <h4>🚫 Filtered Out</h4>
          <div className="excluded-terms">
            {explanation.exclusions.terms.map((term, idx) => (
              <span key={idx} className="excluded-chip">{term}</span>
            ))}
          </div>
          <p className="exclusion-reason">{explanation.exclusions.reason}</p>
        </div>
      )}

      {/* Pro Tips */}
      <div className="tips-box">
        <h4>💡 Pro Tips</h4>
        {explanation.tips.map((tip, idx) => (
          <p key={idx} className="tip">• {tip}</p>
        ))}
      </div>
    </div>
  );
};

export default BooleanExplainer;