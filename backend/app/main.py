from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
import os
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import asyncio
import json

# Load environment variables
load_dotenv()

from .models.radio_station import RadioStation
from .services.radio_service import RadioService
from .services.ai_service import AIService

app = FastAPI(title="MRGA API", description="Make Radio Great Again API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
radio_service = RadioService()
ai_service = AIService()

# Request/Response models
class AIChatRequest(BaseModel):
    prompt: str
    provider: str = "deepseek"  # "deepseek" or "openai"

class AIChatResponse(BaseModel):
    response: str
    provider: str

class CreateStationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    country: str
    city: Optional[str] = None
    genre: str
    language: str
    stream_url: str
    website: Optional[str] = None
    image_url: Optional[str] = None
    frequency: Optional[str] = None
    tags: Optional[List[str]] = None
    is_ai_generated: bool = False

class UpdateStationRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    stream_url: Optional[str] = None
    website: Optional[str] = None
    image_url: Optional[str] = None
    frequency: Optional[str] = None
    tags: Optional[List[str]] = None
    is_ai_generated: Optional[bool] = None

@app.get("/")
async def root():
    return {"message": "Welcome to MRGA API - Make Radio Great Again!"}

@app.get("/api/radio-stations", response_model=List[RadioStation])
async def get_radio_stations():
    """Get all radio stations"""
    return radio_service.get_all_stations()

@app.get("/api/radio-stations/{station_id}", response_model=RadioStation)
async def get_radio_station(station_id: int):
    """Get radio station by ID"""
    station = radio_service.get_station_by_id(station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@app.get("/api/genres")
async def get_genres():
    """Get all music genres"""
    return radio_service.get_genres()

@app.get("/api/countries")
async def get_countries():
    """Get all countries"""
    return radio_service.get_countries()

@app.get("/api/languages")
async def get_languages():
    """Get all languages"""
    return radio_service.get_languages()

@app.post("/api/radio-stations", response_model=RadioStation)
async def create_station(station_data: CreateStationRequest):
    """Create new radio station"""
    try:
        new_station = radio_service.add_station(station_data.dict())
        return new_station
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating station: {str(e)}")

@app.put("/api/radio-stations/{station_id}", response_model=RadioStation)
async def update_station(station_id: int, station_data: UpdateStationRequest):
    """Update radio station"""
    try:
        # Remove fields that are not provided
        update_data = {k: v for k, v in station_data.dict().items() if v is not None}
        
        updated_station = radio_service.update_station(station_id, update_data)
        if not updated_station:
            raise HTTPException(status_code=404, detail="Station not found")
        return updated_station
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating station: {str(e)}")

@app.delete("/api/radio-stations/{station_id}")
async def delete_station(station_id: int):
    """Delete radio station"""
    try:
        success = radio_service.delete_station(station_id)
        if not success:
            raise HTTPException(status_code=404, detail="Station not found")
        return {"message": "Station deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting station: {str(e)}")

@app.post("/api/ai/chat")
async def ai_chat(request: AIChatRequest):
    """AI chat to recommend radio stations"""
    try:
        # Build complete prompt with station information
        stations = radio_service.get_all_stations()
        stations_context = "\n".join([
            f"{s.name} - {s.genre} from {s.city}, {s.country} ({s.language}) - {s.description or ''} {s.tags and f'[Tags: {', '.join(s.tags)}]' or ''}"
            for s in stations
        ])

        full_prompt = f"""You are a friendly radio DJ helping people discover radio stations.

Here are all available stations:
{stations_context}

User request: "{request.prompt}"

Based on the user's request, recommend 3-5 relevant stations from the list above. Be conversational, fun, and explain why each station matches their request. Format your response naturally as if chatting with a friend.

Then, at the end of your message, add a line "RECOMMENDED_STATIONS:" followed by the exact station names you recommended (exactly matching the names in the list).

Example format:
"Your message here...

RECOMMENDED_STATIONS: BBC Radio 1, KEXP 90.3 FM, Radio Paradise\""""

        # Call appropriate AI service based on selected provider
        if request.provider == "openai":
            response = await ai_service.call_openai(full_prompt)
        elif request.provider == "deepseek":
            response = await ai_service.call_deepseek(full_prompt)
        else:
            raise HTTPException(status_code=400, detail="Unsupported AI provider")

        return AIChatResponse(response=response, provider=request.provider)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    

# Add streaming endpoint after existing AI chat endpoint
@app.post("/api/ai/chat-stream")
async def ai_chat_stream(request: AIChatRequest):
    """Real streaming AI chat for recommending radio stations"""
    try:
        print(f"Received AI chat stream request: provider={request.provider}, prompt_length={len(request.prompt)}")
        
        # Build complete prompt with station information
        stations = radio_service.get_all_stations()
        stations_context = "\n".join([
            f"{s.name} - {s.genre} from {s.city}, {s.country} ({s.language}) - {s.description or ''} {s.tags and f'[Tags: {', '.join(s.tags)}]' or ''}"
            for s in stations
        ])

        full_prompt = f"""You are a friendly radio DJ helping people discover radio stations.

Here are all available stations:
{stations_context}

User request: "{request.prompt}"

Based on the user's request, recommend 3-5 relevant stations from the list above. Be conversational, fun, and explain why each station matches their request. Format your response naturally as if chatting with a friend.

Then, at the end of your message, add a line "RECOMMENDED_STATIONS:" followed by the exact station names you recommended (exactly matching the names in the list).

Example format:
"Your message here...

RECOMMENDED_STATIONS: BBC Radio 1, KEXP 90.3 FM, Radio Paradise\""""

        print(f"Full prompt length: {len(full_prompt)}")

        # Call appropriate AI service based on selected provider
        if request.provider == "openai":
            print("Using OpenAI provider for stream...")
            return StreamingResponse(
                ai_service.call_openai_stream(full_prompt),
                media_type="text/event-stream",
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }
            )
        elif request.provider == "deepseek":
            print("Using DeepSeek provider for stream...")
            return StreamingResponse(
                ai_service.call_deepseek_stream(full_prompt),
                media_type="text/event-stream",
                headers={
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported AI provider")

    except Exception as e:
        error_msg = f"AI service error: {str(e)}"
        print(f"ERROR: {error_msg}")
        
        async def error_stream():
            yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
        
        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream"
        )

@app.get("/api/health")
async def health_check():
    stations = radio_service.get_all_stations()
    return {"status": "healthy", "stations_count": len(stations)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)