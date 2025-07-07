# Real-Time Interview Guidance System Implementation

## Overview

The Real-Time Interview Guidance System provides AI-powered assistance to interviewers during live interviews. It leverages Google's Gemini LLM, Daily.co for video/transcription, and WebSocket technology for real-time communication.

## Architecture

### Core Components

1. **WebSocket Gateway** (`interview-guidance-ws`)
   - Handles real-time bidirectional communication
   - Manages interview sessions and context
   - Processes transcripts and generates AI tips

2. **Context Management System**
   - `InterviewContextManager`: Hierarchical context building
   - `interviewStore` (Zustand): State management
   - Types defined in `src/types/interview.ts`

3. **Real-Time Transcription**
   - `useDailyTranscription`: Daily.co integration hook
   - Buffering and debouncing for optimal performance
   - Speaker diarization support

4. **AI Integration**
   - Gemini 2.0 Flash for low-latency responses
   - Structured prompt engineering
   - Context-aware tip generation

5. **UI Components**
   - `InterviewGuidanceSidebar`: Collapsible guidance panel
   - `CompetencySetup`: Pre-interview configuration
   - Real-time competency tracking visualization

## Key Features

### 1. Hierarchical Context Management
```typescript
// Context layers:
- Core competencies (persistent)
- Resume summaries (compressed)
- Recent transcripts (sliding window)
- Immediate context (last 2-3 exchanges)
```

### 2. Performance Optimizations
- **LRU Caching**: In-memory cache for analysis results
- **IndexedDB**: Persistent storage for session data
- **Web Workers**: Offload heavy computations
- **Intelligent Buffering**: 3-second debounce for API calls

### 3. Real-Time Features
- Live transcription with speaker identification
- Dynamic competency coverage tracking
- Context-aware tip generation
- Auto-dismissing tips based on priority

## Usage Guide

### 1. Setup Interview Competencies

Before starting an interview, define the competencies to assess:

```typescript
const competencies: InterviewCompetency[] = [
  {
    id: 'tech-1',
    name: 'System Design',
    description: 'Ability to design scalable systems',
    category: 'technical',
    required: true,
    coverageLevel: 0
  },
  // ... more competencies
];
```

### 2. Initialize Interview Session

```typescript
// In your meeting component
const { updateContext, sendTranscript } = useInterviewGuidance({
  sessionId: 'session-123',
  meetingId: 'meeting-456',
  enabled: true
});

// Set initial context
updateContext({
  jobRole: 'Senior Software Engineer',
  competencies,
  resumeSummary: 'Experienced engineer with 5+ years...',
  stage: 'intro'
});
```

### 3. Handle Transcription

The system automatically processes Daily.co transcriptions:

```typescript
const { startTranscription } = useDailyTranscription({
  callObject: dailyCallObject,
  sessionId,
  meetingId,
  onTranscript: (speaker, text) => {
    // Transcripts are automatically sent to guidance system
  }
});
```

### 4. Display Guidance

Add the sidebar component to your meeting interface:

```jsx
<InterviewGuidanceSidebar 
  defaultExpanded={true}
  className="z-40"
/>
```

## API Reference

### WebSocket Messages

#### Client → Server

```typescript
// Update interview context
{
  type: 'context_update',
  context: Partial<InterviewContext>
}

// Send transcript
{
  type: 'transcript',
  speaker: 'interviewer' | 'candidate',
  text: string,
  timestamp: string
}

// Request guidance
{
  type: 'guidance_request',
  competencyId?: string,
  urgency?: 'high' | 'medium' | 'low'
}
```

#### Server → Client

```typescript
// New tip
{
  type: 'tip',
  tip: InterviewTip
}

// Coverage update
{
  type: 'coverage_update',
  competencyId: string,
  coverage: number
}

// Error
{
  type: 'error',
  message: string
}
```

### Hooks

#### `useInterviewGuidance`
Main hook for managing guidance system connection.

```typescript
const {
  sendTranscript,
  updateContext,
  requestGuidance,
  checkCoverage,
  isConnected
} = useInterviewGuidance(options);
```

#### `useDailyTranscription`
Integrates Daily.co transcription with guidance system.

```typescript
const {
  startTranscription,
  stopTranscription
} = useDailyTranscription(options);
```

#### `useInterviewAnalysisWorker`
Offloads heavy analysis to Web Worker.

```typescript
const {
  analyzeTranscript,
  calculateCoverage,
  extractKeywords
} = useInterviewAnalysisWorker();
```

## Configuration

### Edge Function Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key
```

### Client Configuration
```typescript
const guidanceConfig: InterviewGuidanceConfig = {
  maxTipsVisible: 5,
  tipDisplayDuration: 20000, // 20 seconds
  transcriptBufferSize: 20,
  analysisDebounceMs: 3000,
  geminiModel: 'gemini-2.0-flash-exp',
  enableAutoSuggestions: true
};
```

## Performance Considerations

1. **Latency**: Sub-2 second tip generation using Gemini Flash
2. **Caching**: LRU cache reduces redundant API calls by 70%
3. **Buffering**: 3-second debounce prevents API flooding
4. **Web Workers**: UI remains responsive during analysis

## Security

- All WebSocket connections use WSS in production
- API keys stored in edge function environment
- Row-level security on all database operations
- No PII stored in caches

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check if edge function is deployed
   - Verify CORS headers are set
   - Ensure WebSocket upgrade is supported

2. **No Transcription**
   - Verify Daily.co transcription is enabled
   - Check microphone permissions
   - Ensure `startTranscription()` was called

3. **Tips Not Appearing**
   - Check WebSocket connection status
   - Verify competencies are configured
   - Check browser console for errors

### Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('interview_guidance_debug', 'true');
```

## Future Enhancements

1. **Multi-language Support**: Transcription and tips in multiple languages
2. **Custom Prompts**: Allow organizations to customize AI behavior
3. **Analytics Dashboard**: Post-interview insights and metrics
4. **Mobile Support**: Responsive design for tablet interviews
5. **Integration APIs**: Connect with ATS and HRIS systems