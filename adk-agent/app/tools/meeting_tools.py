"""Meeting and recording tools for the ADK agent."""
from typing import Optional
from app.tools.base import call_firebase_function
async def create_daily_room(
    room_name: Optional[str] = None,
    privacy: str = "private",
    enable_recording: bool = True,
    enable_chat: bool = True,
    max_participants: int = 10,
    expires_at: Optional[str] = None,
) -> dict:
    """
    Create a Daily.co video meeting room for interviews.

    This tool creates a video meeting room that can be used for
    remote interviews with optional recording.

    Args:
        room_name: Custom room name (auto-generated if not provided)
        privacy: Room privacy setting ("public", "private")
        enable_recording: Allow meeting recording
        enable_chat: Enable in-meeting chat
        max_participants: Maximum number of participants
        expires_at: When the room expires (ISO timestamp)

    Returns:
        A dictionary containing:
        - room_url: URL for the meeting room
        - room_name: Name of the created room
        - expires_at: Room expiration time
        - recording_enabled: Whether recording is enabled
        - settings: Room configuration

    Example:
        >>> result = await create_daily_room(
        ...     room_name="interview-john-doe-2024-01-15",
        ...     enable_recording=True,
        ...     max_participants=4
        ... )
    """
    payload = {
        "privacy": privacy,
        "enableRecording": enable_recording,
        "enableChat": enable_chat,
        "maxParticipants": max_participants
    }
    if room_name:
        payload["roomName"] = room_name
    if expires_at:
        payload["expiresAt"] = expires_at

    return await call_firebase_function("createDailyRoom", payload)
async def process_recording(
    recording_url: Optional[str] = None,
    recording_id: Optional[str] = None,
    generate_transcript: bool = True,
    generate_summary: bool = True,
    extract_action_items: bool = True,
    identify_speakers: bool = True,
) -> dict:
    """
    Process a meeting recording to extract insights.

    This tool analyzes meeting recordings to generate transcripts,
    summaries, and action items.

    Args:
        recording_url: URL of the recording file
        recording_id: ID of a Daily.co recording
        generate_transcript: Generate full transcript
        generate_summary: Generate meeting summary
        extract_action_items: Extract action items and next steps
        identify_speakers: Identify and label different speakers

    Returns:
        A dictionary containing:
        - transcript: Full meeting transcript
        - summary: Meeting summary
        - action_items: Extracted action items
        - speakers: Identified speakers and their contributions
        - duration: Recording duration
        - key_topics: Main topics discussed
        - sentiment: Overall meeting sentiment

    Example:
        >>> result = await process_recording(
        ...     recording_id="rec_abc123",
        ...     generate_transcript=True,
        ...     generate_summary=True,
        ...     extract_action_items=True
        ... )
    """
    payload = {
        "generateTranscript": generate_transcript,
        "generateSummary": generate_summary,
        "extractActionItems": extract_action_items,
        "identifySpeakers": identify_speakers
    }
    if recording_url:
        payload["recordingUrl"] = recording_url
    if recording_id:
        payload["recordingId"] = recording_id

    return await call_firebase_function("processRecording", payload)
async def transcribe_audio(
    audio_url: Optional[str] = None,
    audio_content: Optional[str] = None,
    language: str = "en-US",
    speaker_diarization: bool = True,
    punctuation: bool = True,
    word_timestamps: bool = False,
) -> dict:
    """
    Transcribe audio content to text.

    This tool converts audio files to text with support for
    multiple speakers and various audio formats.

    Args:
        audio_url: URL of the audio file
        audio_content: Base64 encoded audio content
        language: Audio language code (e.g., "en-US", "es-ES")
        speaker_diarization: Identify different speakers
        punctuation: Add automatic punctuation
        word_timestamps: Include timestamps for each word

    Returns:
        A dictionary containing:
        - transcript: Full text transcript
        - segments: Transcript segments with timestamps
        - speakers: Speaker labels and their segments
        - duration: Audio duration
        - confidence: Transcription confidence score
        - word_count: Total words transcribed

    Example:
        >>> result = await transcribe_audio(
        ...     audio_url="https://storage.example.com/interview.mp3",
        ...     language="en-US",
        ...     speaker_diarization=True
        ... )
    """
    payload = {
        "language": language,
        "speakerDiarization": speaker_diarization,
        "punctuation": punctuation,
        "wordTimestamps": word_timestamps
    }
    if audio_url:
        payload["audioUrl"] = audio_url
    if audio_content:
        payload["audioContent"] = audio_content

    return await call_firebase_function("transcribeAudio", payload)
