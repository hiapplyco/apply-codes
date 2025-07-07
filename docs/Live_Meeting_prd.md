# Real-Time Interview Guidance System with Gemini

**Product Requirements Document**

---

## Overview

This PRD outlines a real-time interview guidance system leveraging Google's Gemini LLM and integrating Daily.co/Pipecat Cloud, Supabase, and open-source technologies. The system supports hiring managers with AI-powered, contextual suggestions during live interviews, ensuring comprehensive competency assessment without disrupting conversation flow.

---

## Objectives

- Deliver real-time, AI-driven interview tips
- Ensure full coverage of predefined competencies
- Maintain latency below 2 seconds
- Leverage Gemini API alongside open-source solutions
- Provide non-intrusive sidebar UI

---

## Key Features

### Real-Time AI Interview Assistance

- Contextual tips using Gemini LLM
- Dynamic adaptation based on conversation flow
- Competency tracking and reminders

### Hierarchical Context Management

- Core competencies (persistent)
- Resume summaries (compressed, session-based)
- Recent transcripts (sliding window)
- Immediate context (last 2-3 exchanges)

### WebSocket-Based Real-Time Communication

- Robust WebSocket gateway
- Reliable reconnection with exponential backoff
- Message queueing for offline resilience

### Performance Optimization

- Intelligent buffering to control API calls
- Multi-layer caching (memory, IndexedDB)
- Web Workers for heavy tasks

### Adaptive Competency Tracking

- Real-time visual coverage indicators
- AI-driven suggestions for under-covered competencies

---

## Technical Architecture

- **Microservices Architecture:**
  - WebSocket Gateway (Real-time client communication)
  - Context Management (Competencies, candidate data)
  - Real-time Processing (Audio transcription via Daily.co/Pipecat)
  - Gemini Integration (Context-aware tip generation)
  - Rate Limiting (API quota protection)

**Architecture Flow:**

```
Client WebSocket → Gateway → Context Manager → Gemini API
                     ↓
                Response Handler → Client
```

---

## User Experience (UX)

- **Collapsible Sidebar**:

  - Non-intrusive, positioned right-side
  - Interview stage indicator
  - Competency coverage tracker
  - Context-aware "Quick Tips"
  - Smart notifications (color-coded visual cues)

- **Progressive Disclosure**: Minimal initial detail with drill-down capabilities

---

## Technical Specifications

### Gemini LLM Integration

- Model: Gemini 2.5 Flash-Lite (optimized for speed and cost)
- Streaming responses for low perceived latency
- Structured Prompts:

```javascript
const generatePrompt = (context) => `
ROLE: Expert interview coach.

CONTEXT:
- Position: ${context.jobRole}
- Competencies: ${context.competencies.join(', ')}
- Candidate Background: ${context.resumeSummary}
- Current Topic: ${context.currentTopic}

LATEST EXCHANGE:
${context.recentTranscript}

GUIDANCE REQUEST:
Provide 2-3 concise tips on:
1. Content improvement
2. Delivery enhancement
3. Competency demonstration
`;
```

### Real-Time Transcription

- Daily.co or Google Cloud STT (primary)
- OpenAI Whisper (open-source, privacy-first alternative)

### State Management (Zustand + Supabase)

- Real-time state synchronization
- Structured session and context management

```javascript
const useInterviewStore = create((set, get) => ({
  context: {},
  realtime: {},
  updateContext: (ctx) => set({ context: ctx }),
  updateRealtime: (data) => set((state) => ({ realtime: {...state.realtime, ...data}}))
}));
```

### WebSocket Implementation

- Exponential backoff and automatic reconnections
- Message queueing for resilience

```javascript
class TranscriptStreamer {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.reconnect.bind(this);
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.type === 'tip') this.displayTip(message);
  }

  reconnect() {
    setTimeout(() => new TranscriptStreamer(this.url), 2000);
  }
}
```

---

## Migration from Daily.co to Pipecat Cloud

- Transition webhook-based transcription handling
- Update SDK event listeners
- Adopt new Pipecat Cloud API standards

---

## Implementation Roadmap

- **Phase 1:** WebSocket setup, basic Daily.co transcription
- **Phase 2:** Gemini API and context management
- **Phase 3:** Supabase integration for real-time sync
- **Phase 4:** Sidebar UI implementation
- **Phase 5:** Performance optimization (caching, Web Workers)
- **Phase 6:** Advanced competency visualization

---

## Risks & Mitigation

| Risk                       | Mitigation                                    |
| -------------------------- | --------------------------------------------- |
| Gemini API latency         | Use Flash-Lite model, optimize prompts        |
| Transcription errors       | Implement STT diarization/error handling      |
| WebSocket reliability      | Automatic reconnection, message queueing      |
| API Quota exhaustion       | Intelligent buffering, rate limiting          |
| Privacy & ethical concerns | Transparent data usage, restricted web search |

---

## Success Metrics

- **Guidance accuracy:** 80%+ positive user feedback
- **Latency:** <2 seconds per tip
- **Engagement:** 70% of suggestions actively considered
- **Competency coverage:** 90%+ across interviews
- **Uptime:** >99.5%

---

## Appendices

### Appendix A: Detailed Technical Guidelines

- Comprehensive context and architecture explanation
- Prompt design specifics
- Error handling and latency reduction strategies

### Appendix B: LLM Comparative Analysis

- Gemini vs GPT-4, Mistral, LLaMA
- Open-source and proprietary transcription options

### Appendix C: Implementation Best Practices

- WebSocket reliability and reconnection strategies
- Cost and privacy management recommendations
- Continuous improvement processes
- Open-source integration guidelines

---

## Conclusion

By integrating advanced Gemini LLM capabilities with robust open-source technologies, this system ensures hiring managers remain aligned with competencies and conduct structured, insightful interviews. This PRD provides a comprehensive roadmap, balancing powerful AI integration with user-centric design and practical implementation strategies.

