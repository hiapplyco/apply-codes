import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Target, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewStore, selectUncoveredCompetencies, selectHighPriorityTips } from '@/stores/interviewStore';
import { cn } from '@/lib/utils';
import type { InterviewTip, InterviewCompetency } from '@/types/interview';

interface InterviewGuidanceSidebarProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const InterviewGuidanceSidebar: React.FC<InterviewGuidanceSidebarProps> = ({
  className,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  const {
    context,
    activeTips,
    connectionStatus,
    isTranscribing,
    removeTip,
  } = useInterviewStore();

  const uncoveredCompetencies = useInterviewStore(selectUncoveredCompetencies);
  const highPriorityTips = useInterviewStore(selectHighPriorityTips);

  // Auto-dismiss tips after duration
  useEffect(() => {
    const timers = activeTips.map((tip) => {
      const duration = tip.priority === 'high' ? 30000 : 20000; // 30s for high, 20s for others
      return setTimeout(() => {
        setDismissedTips((prev) => new Set(prev).add(tip.id));
      }, duration);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [activeTips]);

  const visibleTips = activeTips.filter((tip) => !dismissedTips.has(tip.id));

  const getStageColor = (stage: string) => {
    const colors = {
      intro: 'bg-blue-500',
      technical: 'bg-purple-500',
      behavioral: 'bg-green-500',
      questions: 'bg-yellow-500',
      closing: 'bg-gray-500',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500';
  };

  const getTipIcon = (type: InterviewTip['type']) => {
    switch (type) {
      case 'competency':
        return <Target className="w-4 h-4" />;
      case 'delivery':
        return <Clock className="w-4 h-4" />;
      case 'follow-up':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTipColor = (priority: InterviewTip['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: isExpanded ? 0 : 280 }}
      transition={{ type: 'spring', damping: 20 }}
      className={cn(
        'fixed right-0 top-0 h-full w-80 bg-white border-l-2 border-black shadow-[-4px_0_0_0_rgba(0,0,0,1)] z-50',
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -left-10 top-20 bg-purple-600 text-white p-2 rounded-l-lg border-2 border-r-0 border-black shadow-[-2px_2px_0_0_rgba(0,0,0,1)]"
      >
        {isExpanded ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-purple-100">
        <h2 className="text-xl font-bold">Interview Guidance</h2>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
          {isTranscribing && (
            <span className="text-sm text-purple-600 ml-auto">Transcribing...</span>
          )}
        </div>
      </div>

      {/* Interview Stage */}
      <div className="p-4 border-b-2 border-black">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Stage</span>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-white text-sm font-medium',
              getStageColor(context.stage)
            )}
          >
            {context.stage.charAt(0).toUpperCase() + context.stage.slice(1)}
          </div>
        </div>
        {context.currentTopic && (
          <p className="text-sm text-gray-600 mt-2">Topic: {context.currentTopic}</p>
        )}
      </div>

      {/* Competency Coverage */}
      <div className="p-4 border-b-2 border-black">
        <h3 className="font-medium mb-2">Competency Coverage</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {context.competencies.map((comp) => (
            <div key={comp.id} className="flex items-center justify-between">
              <span className="text-sm truncate flex-1">{comp.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      comp.coverageLevel >= 70 ? 'bg-green-500' :
                      comp.coverageLevel >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${comp.coverageLevel}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {comp.coverageLevel}%
                </span>
              </div>
            </div>
          ))}
        </div>
        {uncoveredCompetencies.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-xs text-yellow-800">
              {uncoveredCompetencies.length} competencies need more coverage
            </p>
          </div>
        )}
      </div>

      {/* Active Tips */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="font-medium mb-2">Quick Tips</h3>
        <AnimatePresence>
          {visibleTips.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">
              Tips will appear here during the interview
            </p>
          ) : (
            <div className="space-y-2">
              {visibleTips.slice(0, 5).map((tip) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    getTipColor(tip.priority)
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getTipIcon(tip.type)}
                    <div className="flex-1">
                      <p className="text-sm">{tip.message}</p>
                      {tip.suggestedQuestion && (
                        <div className="mt-2 p-2 bg-white rounded border border-gray-300">
                          <p className="text-xs font-medium">Suggested question:</p>
                          <p className="text-xs italic mt-1">{tip.suggestedQuestion}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeTip(tip.id);
                        setDismissedTips((prev) => new Set(prev).add(tip.id));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* High Priority Alert */}
        {highPriorityTips.length > 0 && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mt-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                {highPriorityTips.length} high priority tips
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};