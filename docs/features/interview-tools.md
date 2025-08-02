# Interview & Meeting Tools

This document outlines the comprehensive "Kickoff Call" and "Interview Room" experience, which combines multimodal input capabilities, dynamic interview guidance, and real-time content creation with dashboard visualizations.

## Architecture

The system is built on a microservices architecture, leveraging Google's Gemini LLM, Daily.co for video/transcription, and WebSocket technology for real-time communication.

-   **WebSocket Gateway (`interview-guidance-ws`):** Handles real-time bidirectional communication, manages interview sessions and context, and processes transcripts to generate AI tips.
-   **Context Management System:** A hierarchical context management system builds a comprehensive understanding of the interview, including core competencies, resume summaries, and recent transcripts.
-   **Real-Time Transcription:** Integration with Daily.co provides live transcription with speaker identification, buffering, and debouncing for optimal performance.
-   **AI Integration:** Gemini 2.5 Flash is used for low-latency, context-aware tip generation.

## Key Features

-   **Unified Kickoff Call Page:** A single, dynamic page with multiple modes for interview setup, live interviewing, and analysis.
-   **Expanded Interview Types:** Support for a wide range of interview types, including technical, behavioral, case study, and cultural fit.
-   **Multimodal Input System:**
    -   **File Upload:** Upload context files like resumes and job descriptions.
    -   **Audio/Video:** Record audio and video with real-time transcription.
-   **Dynamic Interview Chat System:** A real-time chat interface with AI-driven guidance, dynamic question recommendations, and a "Choose Your Adventure" logic for conversation flow.
-   **Content Generation & Dashboard:** Real-time generation of interview summaries, key insights, and candidate evaluation reports, with dashboard visualizations for tracking progress and analyzing performance.

## Usage

### 1. Setup Interview Competencies
Before starting an interview, define the competencies to be assessed.

### 2. Initialize Interview Session
Set the initial context for the interview, including the job role, competencies, and resume summary.

### 3. Handle Transcription
The system automatically processes Daily.co transcriptions and sends them to the guidance system.

### 4. Display Guidance
The `InterviewGuidanceSidebar` component can be added to the meeting interface to display real-time tips and competency tracking.
