# VoiceForge - Text-to-Speech & Voice Cloning Application

A production-ready web application for converting text to natural-sounding speech with AI voice cloning capabilities.

## Overview

VoiceForge enables users to:
- Convert text to speech with multiple language/accent options
- Clone voices from uploaded audio samples (15+ seconds recommended)
- Clone voices from microphone recordings
- Customize speech parameters (speed, pitch, speaking style)
- Preview and download generated audio files
- Manage cloned voices

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- TanStack Query for data fetching

### Backend
- Python 3.11
- FastAPI web framework
- **Hybrid TTS System**:
  - Google Cloud Text-to-Speech for English ($4/1M characters)
  - ElevenLabs v3 Model for Indian languages (70+ languages)
  - Automatic language detection and routing
- Voice cloning via ElevenLabs API
- Uvicorn ASGI server

## Project Structure

```
/
├── api/                    # Python backend
│   └── main.py            # FastAPI application
├── client/                # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities
│   └── index.html
├── .env                   # Environment variables (not in git)
└── .env.example          # Example environment config
```

## Setup

### API Keys

Required:
1. **ElevenLabs API Key** (required for Indian languages and voice cloning)
   - Get from: https://elevenlabs.io/app/settings/api-keys
   - Copy `.env.example` to `.env`
   - Add as `ELEVENLABS_API_KEY` in `.env`

Optional (for cost optimization):
2. **Google Cloud API Key** (optional, for cheaper English TTS)
   - Get from: https://console.cloud.google.com/apis/credentials
   - Enable "Cloud Text-to-Speech API"
   - Add as `GOOGLE_CLOUD_CREDENTIALS` in Replit Secrets
   - Saves cost: $4/1M characters vs ElevenLabs pricing

### Running the Application

The application runs two services:
1. **Python Backend** (port 8000): FastAPI server handling TTS operations
2. **Vite Frontend** (port 5000): React development server

Both services are configured to start automatically via Replit workflows.

## API Endpoints

### GET `/api/voices`
Get list of available voices from both services:
- Google Cloud English voices (217 voices: 54 Standard/Wavenet + 163 Journey voices)
- ElevenLabs voices (23+ voices, multilingual with v3 model)
- Each voice includes preview_url for audio previews (Standard/Wavenet and ElevenLabs only)

### GET `/api/voices/preview/{voice_id}`
Generate voice preview audio for Google Cloud voices:
- Only supports Standard/Wavenet voices (Journey voices excluded)
- Returns 3-second MP3 sample with preview text
- Used by frontend voice selector for instant previews

### POST `/api/tts`
Generate text-to-speech audio with provider-based routing:
- Routes based on selected voice provider (Google Cloud or ElevenLabs)
- Google Cloud voices: Cost-optimized at $4/1M characters (English focus)
- ElevenLabs v3 voices: Quality-optimized for 70+ languages (any voice speaks any language)
- Body: `{ text, voice_id, speed, pitch, style }`
- Returns: MP3 audio file

### POST `/api/voices/clone`
Clone a voice from uploaded audio
- Form data: `name` (string), `audio_file` (file)
- Returns: Cloned voice data

### GET `/api/voices/cloned`
Get list of cloned voices

### DELETE `/api/voices/cloned/{voice_id}`
Delete a cloned voice

## Features

### Text Input
- Paste or type text directly
- Upload .txt files
- Character counter

### Voice Selection
- **240 total voices** across providers:
  - **217 Google Cloud English voices** (American, British, Australian, Indian accents)
    - 54 Standard/Wavenet voices (with instant previews)
    - 163 Journey voices (high-quality named voices like "Achernar", "Charon")
  - **23 ElevenLabs voices** - any voice can speak in 70+ languages using v3 Model
    - Indian languages: Hindi, Telugu, Kannada, Tamil, Marathi, Bengali, Gujarati, Punjabi, Malayalam
    - European languages: Spanish, French, German, Italian, Portuguese, Russian
    - Asian languages: Japanese, Korean, Chinese
    - African, Middle Eastern, and other global languages
- **Searchable voice dropdown** - find voices by name, language, or accent
- **Voice previews** - play button next to each voice for instant audio preview:
  - Google Standard/Wavenet voices: Generated on-demand via backend
  - ElevenLabs voices: Direct preview URLs from ElevenLabs API
  - Journey voices: No preview (require special model configuration)
  - Race condition prevention ensures only one preview plays at a time
- Custom cloned voices
- Voice metadata display with descriptive names (e.g., "Australian Female A (Standard)")
- Only real voices from APIs (no fake demo voices)

### Voice Cloning
- Upload audio files (MP3, WAV)
- Record from microphone
- Requires 15+ seconds of clear audio

### Audio Settings
- Speed control (0.5x - 2.0x)
- Pitch adjustment (-12 to +12 semitones)
- Speaking style selection

### Audio Output
- Waveform visualization
- Playback controls
- Download as MP3

## Development Notes

- Frontend uses mock data initially (marked with `//todo: remove mock functionality`)
- Backend integrates with ElevenLabs API for production TTS
- All interactive elements include `data-testid` attributes for testing
- Dark mode supported via theme toggle

## Recent Changes

- 2025-11-08: Initial setup with Python backend and React frontend
- Design follows Linear-inspired minimalist utility design
- Integrated ElevenLabs API for voice synthesis and cloning
- **Upgraded to ElevenLabs v3 Model** - supports 70+ languages (90% of world population)
- Any voice can now speak in any of the 70+ supported languages
- **Implemented hybrid TTS routing system:**
  - Google Cloud TTS API key support (simplified setup vs JSON credentials)
  - Routes based on selected voice provider (voice_id prefix determines service)
  - Google Cloud TTS for English voices (10x cost savings: $4/1M chars)
  - ElevenLabs v3 for multilingual voices (70+ languages)
  - Voice catalog expanded to 240 voices (217 Google + 23 ElevenLabs)
- Backend includes language detection for Indian and European languages from ElevenLabs voice labels
- Implemented searchable voice dropdown with real-time filtering by name, language, or accent
- Shows only real voices from APIs (Google Cloud + ElevenLabs)
- Removed fake demo voices - all displayed voices are actual API voices
- **Fixed routing bug**: Voice provider now correctly determined by voice_id prefix rather than text language detection
- **Voice Preview Feature (2025-11-08)**:
  - Added instant voice previews in voice selector dropdown
  - Play buttons next to each voice (Standard/Wavenet + ElevenLabs)
  - Backend endpoint `/api/voices/preview/{voice_id}` generates 3-second samples
  - ElevenLabs voices use direct preview URLs from API
  - Race condition prevention ensures clean audio switching
  - Journey voices excluded from previews (require special model configuration)
