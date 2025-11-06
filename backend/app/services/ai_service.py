import os
import requests
import json
import asyncio
from fastapi import HTTPException
from typing import List, Optional, AsyncGenerator

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        print(f"OpenAI API Key configured: {bool(self.openai_api_key)}")
        print(f"DeepSeek API Key configured: {bool(self.deepseek_api_key)}")
    
    async def call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        if not self.openai_api_key:
            error_msg = "OpenAI API key not configured"
            print(f"ERROR: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        try:
            print(f"Calling OpenAI API with prompt length: {len(prompt)}")
            
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a friendly radio DJ helping people discover radio stations. Recommend relevant stations based on user requests and explain why each station meets their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact station names you recommend (separated by commas)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            print(f"OpenAI API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                print(f"ERROR: {error_msg}")
                # Fallback to mock response
                return self._get_fallback_response(prompt)
                
        except Exception as e:
            error_msg = f"OpenAI API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            # Fallback to mock response
            return self._get_fallback_response(prompt)
    
    async def call_deepseek(self, prompt: str) -> str:
        """Call DeepSeek API"""
        if not self.deepseek_api_key:
            error_msg = "DeepSeek API key not configured"
            print(f"ERROR: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        try:
            print(f"Calling DeepSeek API with prompt length: {len(prompt)}")
            
            headers = {
                "Authorization": f"Bearer {self.deepseek_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a friendly radio DJ helping people discover radio stations. Recommend relevant stations based on user requests and explain why each station meets their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact station names you recommend (separated by commas)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "stream": False
            }
            
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            print(f"DeepSeek API response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                error_msg = f"DeepSeek API error: {response.status_code} - {response.text}"
                print(f"ERROR: {error_msg}")
                # Fallback to mock response
                return self._get_fallback_response(prompt)
                
        except Exception as e:
            error_msg = f"DeepSeek API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            # Fallback to mock response
            return self._get_fallback_response(prompt)
        


    async def call_openai_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Call OpenAI API streaming response"""
        if not self.openai_api_key:
            yield "OpenAI API key not configured"
            return
        
        try:
            print(f"Calling OpenAI API stream with prompt length: {len(prompt)}")
            
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a friendly radio DJ helping people discover radio stations. Recommend relevant stations based on user requests and explain why each station meets their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact station names you recommend (separated by commas)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "stream": True  # Enable streaming
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                stream=True,  # Enable streaming response
                timeout=30
            )
            
            print(f"OpenAI stream API response status: {response.status_code}")
            
            if response.status_code != 200:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                print(f"ERROR: {error_msg}")
                yield "Sorry, AI service is temporarily unavailable, please try again later."
                return
            
            # Process streaming response
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        line = line[6:]  # Remove "data: " prefix
                        
                        if line == '[DONE]':
                            break
                            
                        try:
                            data = json.loads(line)
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    yield delta['content']
                        except json.JSONDecodeError:
                            continue
                
        except Exception as e:
            error_msg = f"OpenAI stream API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            yield "Sorry, AI service is temporarily unavailable, please try again later."
    
    async def call_deepseek_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Call DeepSeek API streaming response"""
        if not self.deepseek_api_key:
            yield "DeepSeek API key not configured"
            return
        
        try:
            print(f"Calling DeepSeek API stream with prompt length: {len(prompt)}")
            
            headers = {
                "Authorization": f"Bearer {self.deepseek_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "deepseek-chat",
                "messages": [
                    {
                        "role": "system", 
                        "content": "You are a friendly radio DJ helping people discover radio stations. Recommend relevant stations based on user requests and explain why each station meets their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact station names you recommend (separated by commas)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "stream": True  # Enable streaming
            }
            
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers=headers,
                json=data,
                stream=True,  # Enable streaming response
                timeout=30
            )
            
            print(f"DeepSeek stream API response status: {response.status_code}")
            
            if response.status_code != 200:
                error_msg = f"DeepSeek API error: {response.status_code} - {response.text}"
                print(f"ERROR: {error_msg}")
                yield "Sorry, AI service is temporarily unavailable, please try again later."
                return
            
            # Process streaming response
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        line = line[6:]  # Remove "data: " prefix
                        
                        if line == '[DONE]':
                            break
                            
                        try:
                            data = json.loads(line)
                            if 'choices' in data and len(data['choices']) > 0:
                                delta = data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    yield delta['content']
                        except json.JSONDecodeError:
                            continue
                
        except Exception as e:
            error_msg = f"DeepSeek stream API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            yield "Sorry, AI service is temporarily unavailable, please try again later."
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Mock AI response as fallback"""
        prompt_lower = prompt.lower()
        
        if "jazz" in prompt_lower or "paris" in prompt_lower:
            return """Hey! Looking for some jazz from Paris? 🎷✨ I've got the perfect stations for you:

1. **FIP** - Amazing selection of jazz classics and contemporary pieces from the heart of Paris.

2. **BBC Radio 3** - While not exclusively jazz, they have fantastic jazz programming.

3. **Radio Paradise** - Their eclectic mix often includes beautiful jazz selections.

RECOMMENDED_STATIONS: FIP, BBC Radio 1, Radio Paradise"""
        
        elif "morning" in prompt_lower or "upbeat" in prompt_lower:
            return """Good morning! ☀️ Time to get energized! Here are some perfect upbeat stations:

1. **BBC Radio 1** - Perfect for morning energy with the latest hits and upbeat presenters to start your day right!

2. **KEXP 90.3 FM** - Their morning shows are legendary for discovering new, energetic music that'll get you moving.

3. **NTS Radio** - Great for eclectic morning vibes with diverse international sounds.

RECOMMENDED_STATIONS: BBC Radio 1, KEXP 90.3 FM, NTS Radio"""
        
        else:
            return """Hey there! 👋 Based on your request, I recommend:

1. **BBC Radio 1** - Latest hits and chart music
2. **KEXP 90.3 FM** - Amazing for discovering new alternative music
3. **FIP** - Eclectic mix of genres with fantastic curation
4. **Radio Paradise** - Commercial-free listener-supported radio

RECOMMENDED_STATIONS: BBC Radio 1, KEXP 90.3 FM, FIP, Radio Paradise"""