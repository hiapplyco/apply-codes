import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Play, Square } from 'lucide-react';
import { BooleanGenerationAnimation } from './BooleanGenerationAnimation';

export const BooleanAnimationDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const startDemo = () => {
    setIsPlaying(true);
  };

  const stopDemo = () => {
    setIsPlaying(false);
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="p-6 border-2 border-purple-400">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Boolean Generation Animation Demo
        </h2>
        
        <p className="text-gray-600 mb-4">
          This demonstrates the enhanced loading animation that users will see during the 1-2 minute boolean generation process.
          The animation educates users about what's happening during the AI processing.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={startDemo}
            disabled={isPlaying}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Demo (2 minutes)
          </Button>
          
          <Button
            onClick={stopDemo}
            disabled={!isPlaying}
            variant="outline"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Demo
          </Button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Animation Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 5 distinct processing stages with specific messaging</li>
            <li>• Progressive step completion indicators</li>
            <li>• Real-time countdown timer</li>
            <li>• Educational details about AI processing</li>
            <li>• Smooth transitions and engaging visuals</li>
            <li>• Auto-dismisses when boolean generation completes</li>
          </ul>
        </div>
      </Card>

      <BooleanGenerationAnimation
        isOpen={isPlaying}
        onComplete={stopDemo}
        estimatedTimeMs={120000} // 2 minutes for demo
      />
    </div>
  );
};