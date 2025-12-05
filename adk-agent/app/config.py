"""Configuration settings for the ADK agent."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Firebase Configuration
    firebase_project_id: str = "applycodes-2683f"
    firebase_functions_url: str = "https://us-central1-applycodes-2683f.cloudfunctions.net"

    # Google AI Configuration
    google_api_key: str = ""
    google_cloud_project: str = ""

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8080
    debug: bool = False

    # Agent Configuration
    default_model: str = "gemini-2.0-flash"
    complex_model: str = "gemini-2.5-pro"
    max_tool_retries: int = 3
    tool_timeout_seconds: int = 60

    # High-impact tools requiring confirmation
    high_impact_tools: set[str] = {
        "send_email",
        "send_outreach_email",
        "send_campaign_email",
        "schedule_interview",
        "share_google_doc"
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
