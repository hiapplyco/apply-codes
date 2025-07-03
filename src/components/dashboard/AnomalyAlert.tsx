import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingDown, 
  TrendingUp, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';

interface Anomaly {
  id: string;
  type: 'metric' | 'trend' | 'threshold' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  value: number | string;
  expectedValue?: number | string;
  deviation?: number;
  metric: string;
  category: string;
  detectedAt: Date;
  suggestions: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

interface AnomalyAlertProps {
  anomaly: Anomaly;
  onDismiss: (id: string) => void;
  isExpanded?: boolean;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ 
  anomaly, 
  onDismiss,
  isExpanded: defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(true);

  const getSeverityConfig = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600'
        };
      case 'medium':
        return {
          icon: Info,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      case 'low':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const getImpactIcon = (impact: Anomaly['impact']) => {
    switch (impact) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Info;
    }
  };

  const getTypeLabel = (type: Anomaly['type']) => {
    switch (type) {
      case 'metric':
        return 'Metric Anomaly';
      case 'trend':
        return 'Trend Analysis';
      case 'threshold':
        return 'Threshold Alert';
      case 'pattern':
        return 'Pattern Detection';
      default:
        return 'Anomaly';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(anomaly.id), 300);
  };

  const config = getSeverityConfig(anomaly.severity);
  const Icon = config.icon;
  const ImpactIcon = getImpactIcon(anomaly.impact);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        transition-all duration-300 ease-in-out border-2 rounded-lg p-4 mb-3
        ${config.bgColor} ${config.borderColor}
        ${isVisible ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor} flex-shrink-0`} />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-semibold ${config.textColor}`}>
                {anomaly.title}
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full bg-white ${config.textColor} border border-current`}>
                {getTypeLabel(anomaly.type)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                anomaly.severity === 'critical' ? 'bg-red-200 text-red-800' :
                anomaly.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                anomaly.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {anomaly.severity.toUpperCase()}
              </span>
            </div>
            
            <p className={`text-sm ${config.textColor} opacity-90 mb-2`}>
              {anomaly.description}
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <ImpactIcon className={`w-3 h-3 ${
                  anomaly.impact === 'positive' ? 'text-green-600' :
                  anomaly.impact === 'negative' ? 'text-red-600' :
                  'text-gray-600'
                }`} />
                <span className={config.textColor}>
                  {anomaly.impact === 'positive' ? 'Positive' :
                   anomaly.impact === 'negative' ? 'Negative' : 'Neutral'} Impact
                </span>
              </div>
              
              <span className={`${config.textColor} opacity-75`}>
                {anomaly.category} • {anomaly.detectedAt.toLocaleTimeString()}
              </span>
              
              {anomaly.deviation && (
                <span className={`${config.textColor} font-medium`}>
                  {anomaly.deviation.toFixed(1)}% deviation
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            variant="outline"
            className={`border-current ${config.textColor} hover:bg-white/50 p-1`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="outline"
            className={`border-current ${config.textColor} hover:bg-white/50 p-1`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-4">
          {/* Value Comparison */}
          {anomaly.expectedValue && (
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-white/50 rounded-lg p-3 border border-current border-opacity-20`}>
                <div className="text-xs font-medium mb-1 opacity-75">Current Value</div>
                <div className="text-lg font-bold">
                  {typeof anomaly.value === 'number' ? anomaly.value.toLocaleString() : anomaly.value}
                </div>
              </div>
              
              <div className={`bg-white/50 rounded-lg p-3 border border-current border-opacity-20`}>
                <div className="text-xs font-medium mb-1 opacity-75">Expected Value</div>
                <div className="text-lg font-bold">
                  {typeof anomaly.expectedValue === 'number' ? anomaly.expectedValue.toLocaleString() : anomaly.expectedValue}
                </div>
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className={`w-4 h-4 ${config.iconColor}`} />
              <h5 className={`font-medium ${config.textColor}`}>Suggested Actions</h5>
            </div>
            
            <div className="space-y-2">
              {anomaly.suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`text-sm ${config.textColor} opacity-90 pl-4 relative`}
                >
                  <div className="absolute left-0 top-2 w-1.5 h-1.5 bg-current rounded-full opacity-50"></div>
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
          
          {/* Metadata */}
          <div className={`text-xs ${config.textColor} opacity-75 flex items-center justify-between`}>
            <span>Metric: {anomaly.metric} • Category: {anomaly.category}</span>
            <span>Detected: {anomaly.detectedAt.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface AnomalyListProps {
  anomalies: Anomaly[];
  onDismiss: (id: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const AnomalyList: React.FC<AnomalyListProps> = ({
  anomalies,
  onDismiss,
  isVisible,
  onToggleVisibility
}) => {
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;

  if (anomalies.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]">
      {/* Toggle Button */}
      <div className="flex justify-end mb-2">
        <Button
          onClick={onToggleVisibility}
          size="sm"
          className={`
            bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            ${criticalCount > 0 ? 'text-red-600 border-red-300' : 
              highCount > 0 ? 'text-orange-600 border-orange-300' : 
              'text-gray-600'}
          `}
        >
          {isVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {anomalies.length} Alert{anomalies.length !== 1 ? 's' : ''}
          {criticalCount > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {criticalCount} Critical
            </span>
          )}
        </Button>
      </div>
      
      {/* Anomaly List */}
      {isVisible && (
        <div className="max-h-[70vh] overflow-y-auto space-y-3 bg-white/95 backdrop-blur-sm rounded-lg border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Anomaly Detection</h3>
            <span className="text-sm text-gray-600">
              {anomalies.length} anomal{anomalies.length !== 1 ? 'ies' : 'y'} detected
            </span>
          </div>
          
          {anomalies
            .sort((a, b) => {
              // Sort by severity (critical first) then by detection time
              const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
              if (severityDiff !== 0) return severityDiff;
              return b.detectedAt.getTime() - a.detectedAt.getTime();
            })
            .map(anomaly => (
              <AnomalyAlert
                key={anomaly.id}
                anomaly={anomaly}
                onDismiss={onDismiss}
                isExpanded={anomaly.severity === 'critical'}
              />
            ))}
        </div>
      )}
    </div>
  );
};