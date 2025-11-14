from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from deep_translator import GoogleTranslator
from google.cloud import texttospeech
from langdetect import detect, LangDetectException
import httpx
import io
import json

load_dotenv()

app = FastAPI(title="VoiceForge API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ElevenLabs client
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    print("Warning: ELEVENLABS_API_KEY not set. Indian language TTS will not work.")
    elevenlabs_client = None
else:
    elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# Initialize Google Cloud TTS client
GOOGLE_API_KEY = os.getenv("GOOGLE_CLOUD_CREDENTIALS")
if GOOGLE_API_KEY:
    try:
        # Google Cloud TTS with API key
        google_tts_client = texttospeech.TextToSpeechClient(
            client_options={"api_key": GOOGLE_API_KEY}
        )
        print("Google Cloud TTS initialized successfully with API key")
    except Exception as e:
        print(f"Warning: Failed to initialize Google Cloud TTS: {str(e)}")
        google_tts_client = None
else:
    print("Warning: GOOGLE_CLOUD_CREDENTIALS not set. English TTS will use ElevenLabs.")
    google_tts_client = None

# In-memory storage for cloned voices
cloned_voices = {}


class TTSRequest(BaseModel):
    text: str
    voice_id: str
    speed: float = 1.0
    pitch: int = 0
    style: str = "default"


class VoiceCloneRequest(BaseModel):
    name: str


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str


@app.get("/")
async def root():
    return {"message": "VoiceForge API", "status": "running"}


def detect_language(text: str) -> str:
    """Detect language of text"""
    try:
        lang_code = detect(text)
        # Map language codes to language names
        indian_languages = ['hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa']
        if lang_code in indian_languages:
            return 'indian'
        return lang_code
    except LangDetectException:
        return 'en'  # Default to English if detection fails


def format_google_voice_name(voice_name: str, accent: str, gender: str) -> str:
    """Convert technical Google Cloud voice names to user-friendly names"""
    # Check if it's a named voice (Journey voices with star/moon names)
    if not any(x in voice_name for x in ['Standard', 'Wavenet', 'Neural2', 'Studio', 'News', 'Polyglot']):
        # Named voice - just use the name with gender
        gender_text = gender.capitalize() if gender.lower() in ['male', 'female'] else ''
        if gender_text:
            return f"{voice_name} ({accent} {gender_text})"
        return f"{voice_name} ({accent})"
    
    # Technical voice names (Standard/Wavenet)
    parts = voice_name.split('-')
    if len(parts) >= 4:
        voice_type = parts[2]  # Standard, Wavenet, etc.
        voice_letter = parts[3]  # A, B, C, D, etc.
        
        # Make type more user-friendly
        type_map = {
            'Standard': 'Standard',
            'Wavenet': 'Premium',
            'WaveNet': 'Premium'
        }
        friendly_type = type_map.get(voice_type, voice_type)
        
        # Format with gender prominently displayed
        gender_text = gender.capitalize() if gender.lower() in ['male', 'female'] else 'Voice'
        
        return f"{accent} {gender_text} {voice_letter} ({friendly_type})"
    
    # Fallback to cleaned up name
    return voice_name.replace('-', ' ')


@app.get("/voices")
async def get_voices():
    """Get list of available preset voices from both Google Cloud (English) and ElevenLabs (Indian languages)"""
    voices = []
    
    # Fetch Google Cloud English voices
    if google_tts_client:
        try:
            google_voices = google_tts_client.list_voices()
            # Filter for English voices only (US, GB, AU, IN accents)
            english_voice_names = set()  # Track unique voice names
            for voice in google_voices.voices:
                # Only include English language codes
                if voice.language_codes[0].startswith('en-'):
                    # Parse language code to get accent
                    lang_code = voice.language_codes[0]
                    accent_map = {
                        'en-US': 'American',
                        'en-GB': 'British',
                        'en-AU': 'Australian',
                        'en-IN': 'Indian',
                    }
                    accent = accent_map.get(lang_code, 'Various')
                    
                    # Extract gender from Google Cloud API
                    # ssml_gender: 0=NEUTRAL, 1=MALE, 2=FEMALE
                    gender_map = {
                        0: 'neutral',
                        1: 'male',
                        2: 'female'
                    }
                    gender = gender_map.get(voice.ssml_gender, 'unknown')
                    
                    # Include named voices (Journey) and Standard/WaveNet voices
                    # Skip Neural2, Studio, News, and Polyglot for cost optimization
                    is_named_voice = not any(x in voice.name for x in ['Standard', 'Wavenet', 'Neural2', 'Studio', 'News', 'Polyglot'])
                    is_standard_wavenet = 'Standard' in voice.name or 'Wavenet' in voice.name
                    
                    if is_named_voice or is_standard_wavenet:
                        # Create unique identifier to avoid duplicates
                        voice_key = f"{voice.name}_{lang_code}"
                        if voice_key not in english_voice_names:
                            english_voice_names.add(voice_key)
                            
                            # Create user-friendly name
                            friendly_name = format_google_voice_name(voice.name, accent, gender)
                            
                            voice_id = f"google_{voice.name}_{lang_code}"
                            
                            # Only include preview URLs for Standard/Wavenet voices
                            # Journey voices require special model configuration
                            voice_data = {
                                "id": voice_id,
                                "name": friendly_name,
                                "language": "English",
                                "accent": accent,
                                "gender": gender,
                                "provider": "google"
                            }
                            
                            if is_standard_wavenet:
                                voice_data["preview_url"] = f"/api/voices/preview/{voice_id}"
                            
                            voices.append(voice_data)
        except Exception as e:
            print(f"Error fetching Google Cloud voices: {str(e)}")
    
    # Fetch ElevenLabs voices - all can speak 70+ languages with v3 model
    if elevenlabs_client:
        try:
            voices_response = elevenlabs_client.voices.get_all()
            
            for voice in voices_response.voices:
                # Extract language and accent from labels
                language = "Multilingual"  # All ElevenLabs v3 voices support 70+ languages
                accent = "Various"
                gender = "Unknown"
                
                if voice.labels:
                    accent_label = voice.labels.get("accent", "").lower()
                    description = voice.labels.get("description", "").lower()
                    gender = voice.labels.get("gender", "Unknown")
                    
                    # Detect accent for better categorization
                    if "american" in accent_label or "us" in accent_label:
                        accent = "American"
                    elif "british" in accent_label or "uk" in accent_label:
                        accent = "British"
                    elif "australian" in accent_label:
                        accent = "Australian"
                    elif "indian" in accent_label:
                        accent = "Indian"
                    elif "african" in accent_label:
                        accent = "African"
                
                voices.append({
                    "id": f"elevenlabs_{voice.voice_id}",
                    "name": voice.name,
                    "language": language,
                    "accent": accent,
                    "gender": gender,
                    "provider": "elevenlabs",
                    "preview_url": voice.preview_url  # Direct preview URL from ElevenLabs
                })
        except httpx.HTTPStatusError as e:
            print(f"Error fetching ElevenLabs voices: {str(e)}")
        except Exception as e:
            print(f"Error fetching ElevenLabs voices: {str(e)}")
    
    return {"voices": voices}


@app.get("/voices/preview/{voice_id:path}")
async def get_voice_preview(voice_id: str):
    """Generate a preview audio sample for Google Cloud voices"""
    if not voice_id.startswith('google_'):
        raise HTTPException(status_code=400, detail="Preview only available for Google Cloud voices. ElevenLabs voices use direct preview URLs.")
    
    if not google_tts_client:
        raise HTTPException(status_code=503, detail="Google Cloud TTS not available")
    
    try:
        # Extract Google voice name and language code from ID
        voice_id_parts = voice_id.replace('google_', '').rsplit('_', 1)
        if len(voice_id_parts) == 2:
            voice_name = voice_id_parts[0]
            language_code = voice_id_parts[1]
        else:
            voice_name = voice_id.replace('google_', '')
            language_code = "en-US"
        
        # Generate a short preview text
        preview_text = "Hello, this is a preview of my voice. I can speak naturally and clearly."
        
        # Prepare text input
        synthesis_input = texttospeech.SynthesisInput(text=preview_text)
        
        # Configure voice (Standard/Wavenet voices only)
        voice = texttospeech.VoiceSelectionParams(
            name=voice_name,
            language_code=language_code
        )
        
        # Configure audio with default settings
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )
        
        # Generate speech
        response = google_tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Return audio
        return StreamingResponse(
            io.BytesIO(response.audio_content),
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                "Content-Disposition": "inline"
            }
        )
    except Exception as e:
        print(f"Error generating preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")


@app.post("/tts")
async def generate_tts(request: TTSRequest):
    """Generate text-to-speech audio using Google Cloud (English) or ElevenLabs (Indian languages)"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Route to appropriate service based on voice provider
    # The voice_id prefix determines which service to use
    use_google = request.voice_id.startswith('google_')
    use_elevenlabs = request.voice_id.startswith('elevenlabs_')
    
    try:
        if use_google and google_tts_client:
            # Extract Google voice name and language code from ID
            # Format: google_{voice_name}_{lang_code}
            voice_id_parts = request.voice_id.replace('google_', '').rsplit('_', 1)
            if len(voice_id_parts) == 2:
                voice_name = voice_id_parts[0]
                language_code = voice_id_parts[1]
            else:
                # Fallback for older format
                voice_name = request.voice_id.replace('google_', '')
                language_code = "en-US"
            
            # Prepare text input
            synthesis_input = texttospeech.SynthesisInput(text=request.text)
            
            # Configure voice with matching language code
            voice = texttospeech.VoiceSelectionParams(
                name=voice_name,
                language_code=language_code
            )
            
            # Configure audio - map speed to speaking_rate
            speaking_rate = request.speed  # Google supports 0.25-4.0
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=request.pitch  # Google supports -20.0 to 20.0
            )
            
            # Generate speech
            response = google_tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Return audio
            return StreamingResponse(
                io.BytesIO(response.audio_content),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "attachment; filename=generated-speech.mp3"
                }
            )
        
        elif use_elevenlabs and elevenlabs_client:
            # Extract ElevenLabs voice ID
            voice_id = request.voice_id.replace('elevenlabs_', '')
            
            # Clamp speed to ElevenLabs supported range (0.7-1.2)
            clamped_speed = max(0.7, min(1.2, request.speed))
            
            # Map style to stability
            style_to_stability = {
                "default": 0.5,
                "conversational": 0.3,
                "professional": 0.7,
                "cheerful": 0.2,
                "empathetic": 0.4,
            }
            stability = style_to_stability.get(request.style, 0.5)
            
            # Generate audio using ElevenLabs v3 (supports 70+ languages including Indian)
            audio_generator = elevenlabs_client.text_to_speech.convert(
                voice_id=voice_id,
                text=request.text,
                model_id="eleven_v3",
                voice_settings=VoiceSettings(
                    stability=stability,
                    similarity_boost=0.75,
                    style=0.5,
                    use_speaker_boost=True,
                    speed=clamped_speed
                )
            )
            
            # Collect audio chunks
            audio_data = b""
            for chunk in audio_generator:
                audio_data += chunk
            
            # Return audio
            return StreamingResponse(
                io.BytesIO(audio_data),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "attachment; filename=generated-speech.mp3"
                }
            )
        else:
            raise HTTPException(
                status_code=503,
                detail="No TTS service available for this language/voice combination"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")


@app.post("/voices/clone")
async def clone_voice(
    name: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """Clone a voice from an uploaded audio file"""
    if not elevenlabs_client:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")
    
    if not name.strip():
        raise HTTPException(status_code=400, detail="Voice name cannot be empty")
    
    # Read audio file
    audio_data = await audio_file.read()
    
    try:
        # Save audio file temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        
        try:
            # Create voice using ElevenLabs IVC API
            voice = elevenlabs_elevenlabs_client.voices.ivc.create(
                name=name,
                files=[temp_file_path]
            )
            
            # Store in our cloned voices
            voice_data = {
                "id": voice.voice_id,
                "name": name,
                "createdAt": "Just now"
            }
            cloned_voices[voice.voice_id] = voice_data
            
            return voice_data
        finally:
            # Clean up temp file
            os.unlink(temp_file_path)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            error_detail = e.response.json() if e.response.content else {}
            error_str = str(error_detail)
            
            # Check for subscription limitation
            if "can_not_use_instant_voice_cloning" in error_str or "no access to use instant voice cloning" in error_str:
                raise HTTPException(
                    status_code=402,
                    detail="Voice cloning requires an ElevenLabs paid plan. Please upgrade your subscription at: https://elevenlabs.io/pricing"
                )
            # Check for missing API key permissions
            elif "missing_permissions" in error_str or "voices_write" in error_str:
                raise HTTPException(
                    status_code=401,
                    detail="API key missing 'voices_write' permission. Please enable voice cloning permission in your ElevenLabs API key settings at: https://elevenlabs.io/app/settings/api-keys"
                )
            raise HTTPException(status_code=401, detail="Invalid API key or insufficient permissions")
        raise HTTPException(status_code=500, detail=f"Error cloning voice: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cloning voice: {str(e)}")


@app.get("/voices/cloned")
async def get_cloned_voices():
    """Get list of cloned voices"""
    return {"voices": list(cloned_voices.values())}


@app.delete("/voices/cloned/{voice_id}")
async def delete_cloned_voice(voice_id: str):
    """Delete a cloned voice"""
    if not elevenlabs_client:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")
    
    if voice_id not in cloned_voices:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    try:
        # Delete from ElevenLabs
        elevenlabs_client.voices.delete(voice_id)
        
        # Remove from our storage
        del cloned_voices[voice_id]
        
        return {"message": "Voice deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting voice: {str(e)}")


@app.post("/translate")
async def translate_text(request: TranslateRequest):
    """Translate text to target language"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Use deep-translator with Google Translate
        translator = GoogleTranslator(
            source=request.source_lang,
            target=request.target_lang
        )
        
        translated = translator.translate(request.text)
        
        return {
            "translated_text": translated,
            "source_lang": request.source_lang,
            "target_lang": request.target_lang
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
