from pydantic import BaseModel
from typing import List, Optional

class RadioStation(BaseModel):
    id: int
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