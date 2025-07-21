# Interview Guidance Setup Guide

## Quick Start

### 1. Deploy the Edge Function

First, ensure the interview guidance WebSocket edge function is deployed:

```bash
# From project root directory
./deploy-interview-guidance.sh
```

This will:
- Deploy the `interview-guidance-ws` edge function
- Set up the GEMINI_API_KEY secret
- Configure WebSocket support

### 2. Test the WebSocket Connection

Verify the deployment works:

```bash
node test-interview-guidance.js
```

You should see:
- ✅ WebSocket connected
- 💡 Interview tips being generated
- 📊 Competency coverage updates

### 3. Using Interview Guidance in Meetings

1. **Start an Interview Meeting**
   - Select "Interview" as the meeting type
   - Click "Join Meeting"

2. **Enable AI Guidance**
   - Once in the meeting, click the 🧠 Brain button in the control bar
   - The guidance sidebar will appear on the right

3. **Configure Competencies**
   - The system comes with default competencies
   - You can add/remove competencies before or during the interview
   - Mark competencies as required/optional

4. **Real-Time Assistance**
   - As the conversation progresses, you'll see:
     - 💡 Contextual interview tips
     - 📊 Competency coverage tracking
     - ❓ Suggested follow-up questions
     - 🎯 Areas that need more exploration

## Troubleshooting

### WebSocket Connection Issues

If the guidance isn't working:

1. Check edge function logs:
   ```bash
   supabase functions logs interview-guidance-ws
   ```

2. Verify GEMINI_API_KEY is set:
   ```bash
   supabase secrets list
   ```

3. Check browser console for errors (F12)

### No Tips Appearing

1. Ensure transcription is working:
   - Check if you see "Transcription Active" in the UI
   - Verify microphone permissions are granted
   - Look for transcript text in the console

2. Check WebSocket connection:
   - Open browser DevTools → Network tab
   - Look for WebSocket connection to `interview-guidance-ws`
   - Should show status: 101 Switching Protocols

3. Verify competencies are configured:
   - At least one competency must be defined
   - Competencies should have clear descriptions

### Performance Issues

If the UI feels sluggish:

1. The Web Worker implementation exists but isn't currently used
2. Analysis happens on the main thread for now
3. Future optimization will move analysis to Web Worker

## Development Notes

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Daily.co Call  │────▶│ Transcription   │────▶│  useInterview   │
│                 │     │    Hook         │     │   Guidance      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gemini AI     │◀────│  WebSocket      │◀────│   Interview     │
│   Analysis      │     │  Edge Function  │     │   Store         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │    Guidance     │
                                                 │    Sidebar      │
                                                 └─────────────────┘
```

### Key Files

- **Edge Function**: `/supabase/functions/interview-guidance-ws/index.ts`
- **Main Hook**: `/src/hooks/useInterviewGuidance.ts`
- **Transcription**: `/src/hooks/useDailyTranscription.ts`
- **UI Component**: `/src/components/interview/InterviewGuidanceSidebar.tsx`
- **State Store**: `/src/stores/interviewStore.ts`
- **Types**: `/src/types/interview.ts`

### Environment Variables

Required in `.env.local`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Future Enhancements

1. **Web Worker Integration**
   - Move transcript analysis to Web Worker
   - Reduce main thread blocking
   - Improve UI responsiveness

2. **Enhanced AI Models**
   - Support for different Gemini models
   - Custom prompt templates
   - Industry-specific guidance

3. **Analytics & Reporting**
   - Post-interview summaries
   - Competency coverage reports
   - Interview quality metrics

4. **Multi-language Support**
   - Transcription in multiple languages
   - Localized interview tips
   - Cultural awareness features