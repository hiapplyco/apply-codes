# Real-time Meeting Framework with PipeCat and Gemini

This document outlines a comprehensive framework for building a real-time meeting feature in `apply.codes`. The system will leverage PipeCat for real-time audio processing, Daily for video and audio infrastructure, and Gemini for intelligent, context-aware responses. The goal is to create a seamless and powerful meeting experience for interviews, kickoff calls, and general meetings, with all interactions captured and stored for future reference within a project.

## 1. Conceptual Architecture

The proposed architecture consists of four main components:

*   **Client-side (React):** The `Meeting.tsx` component will serve as the primary user interface. It will manage the video call, display real-time transcriptions, and render AI-generated content.
*   **Video and Audio Infrastructure (Daily):** Daily will provide the core video and audio streaming capabilities, including participant management and media track handling.
*   **Real-time Audio Processing (PipeCat):** PipeCat will be used to create a pipeline that takes raw audio streams from Daily, transcribes them to text, and sends the text to a custom processing service.
*   **AI and Data Layer (Supabase and Gemini):** Supabase will be used for data storage (meeting transcripts, project context) and for hosting the edge function that interacts with the Gemini API. The Gemini API will provide the intelligence for real-time responses.

![Architecture Diagram](https://i.imgur.com/example.png)  <!-- Placeholder for a proper diagram -->

## 2. Real-time Data Flow

The real-time data flow is the core of this framework. Here's a step-by-step breakdown:

1.  **Audio Stream:** The client captures the user's audio and sends it to Daily.
2.  **PipeCat Pipeline:** A PipeCat pipeline, running on a server, connects to the Daily room. It receives the raw audio streams of the participants.
3.  **Speech-to-Text:** The audio is passed to a speech-to-text service (e.g., Deepgram, Whisper) within the PipeCat pipeline.
4.  **WebSocket to Supabase:** The transcribed text is sent from the PipeCat pipeline to a Supabase edge function via a WebSocket connection.
5.  **Gemini Processing:** The Supabase edge function receives the transcribed text, retrieves relevant project context from the database, and sends it to the Gemini API for processing.
6.  **Real-time Response:** The Gemini API returns a response, which is then sent back to the client through the WebSocket connection.
7.  **UI Update:** The client receives the response and updates the UI in real-time (e.g., displaying a suggested question, providing a summary).

## 3. Data Persistence and Project Context

To ensure that all meeting data is captured and available for future use, we will implement the following data storage strategy in Supabase:

### `meetings` Table

*   `id`: (PK) Unique identifier for the meeting.
*   `project_id`: (FK) The project this meeting is associated with.
*   `type`: The type of meeting (`interview`, `kickoff`, `general`).
*   `title`: The title of the meeting.
*   `start_time`: The start time of the meeting.
*   `end_time`: The end time of the meeting.

### `meeting_participants` Table

*   `id`: (PK) Unique identifier.
*   `meeting_id`: (FK) The meeting this participant was in.
*   `user_id`: (FK) The user ID of the participant (if they are an `apply.codes` user).
*   `name`: The name of the participant.

### `meeting_transcripts` Table

*   `id`: (PK) Unique identifier.
*   `meeting_id`: (FK) The meeting this transcript belongs to.
*   `participant_id`: (FK) The participant who spoke.
*   `timestamp`: The timestamp of the utterance.
*   `text`: The transcribed text.

### Leveraging Project Context

When making calls to the Gemini API, the Supabase edge function will first query the database for relevant project context. This could include:

*   The project description and goals.
*   The job description for an interview.
*   Previous meeting transcripts.
*   Uploaded documents.

This context will be included in the prompt sent to Gemini, allowing for highly relevant and intelligent responses.

## 4. Implementation Steps

Here is a high-level breakdown of the implementation process:

1.  **Set up the PipeCat Pipeline:**
    *   Create a new server to host the PipeCat pipeline.
    *   Configure the pipeline to connect to a Daily room.
    *   Add a speech-to-text service to the pipeline.
    *   Implement a custom processor in the pipeline that sends transcribed text to your Supabase edge function via a WebSocket.

2.  **Update the Supabase Edge Function:**
    *   Modify the `initialize-daily-bot` function to handle incoming WebSocket messages from the PipeCat pipeline.
    *   When a message is received, query the database for project context.
    *   Construct a prompt for the Gemini API that includes the transcribed text and the project context.
    *   Send the prompt to the Gemini API and stream the response back to the client through the WebSocket.

3.  **Enhance the `Meeting.tsx` Component:**
    *   Update the `useWebSocket` hook to handle incoming messages from the Supabase edge function.
    *   Create new UI components to display the real-time AI-generated content.
    *   Implement the logic for inviting users to a meeting and managing participants.

## 5. UX Considerations

*   **Real-time Feedback:** Provide clear visual cues to the user when the AI is processing information and when new content is available.
*   **AI Transparency:** Clearly label AI-generated content to distinguish it from human-generated content.
*   **User Control:** Give the user control over the AI's involvement in the meeting. For example, allow them to turn off AI suggestions.
*   **Graceful Degradation:** Ensure that the meeting can continue without interruption if the AI services are unavailable.

By following this framework, you can build a powerful and sophisticated real-time meeting feature that will provide immense value to your users.