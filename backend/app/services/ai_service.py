import aiohttp
import json
import asyncio
from fastapi import HTTPException
from typing import AsyncGenerator
import os

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        print(f"OpenAI API Key configured: {bool(self.openai_api_key)}")
        print(f"DeepSeek API Key configured: {bool(self.deepseek_api_key)}")
    
    async def call_deepseek_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Implement true DeepSeek API streaming call using aiohttp"""
        if not self.deepseek_api_key:
            yield "data: " + json.dumps({"error": "DeepSeek API key not configured"}) + "\n\n"
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
                        "content": "You are a friendly radio DJ helping people discover radio stations. Based on the user's request, recommend relevant stations and explain why each one fits their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact names of the stations you recommended (comma-separated)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "stream": True
            }
            
            # Perform true async streaming request using aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.deepseek.com/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    
                    print(f"DeepSeek stream API response status: {response.status}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        error_msg = f"DeepSeek API error: {response.status} - {error_text}"
                        print(f"ERROR: {error_msg}")
                        yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
                        return
                    
                    # True streaming processing
                    buffer = ""
                    async for chunk in response.content:
                        if chunk:
                            buffer += chunk.decode('utf-8')
                            lines = buffer.split('\n')
                            buffer = lines.pop() if lines else ""
                            
                            for line in lines:
                                line = line.strip()
                                if line.startswith('data: '):
                                    data_line = line[6:]
                                    
                                    if data_line == '[DONE]':
                                        yield "data: " + json.dumps({"done": True}) + "\n\n"
                                        return
                                    
                                    try:
                                        json_data = json.loads(data_line)
                                        if 'choices' in json_data and json_data['choices']:
                                            delta = json_data['choices'][0].get('delta', {})
                                            if 'content' in delta and delta['content']:
                                                # Send standard SSE format
                                                yield "data: " + json.dumps({
                                                    "content": delta['content'],
                                                    "done": False
                                                }) + "\n\n"
                                    except json.JSONDecodeError as e:
                                        print(f"JSON decode error: {e}, data: {data_line}")
                                        continue
                    
                    # Ensure completion signal is sent
                    yield "data: " + json.dumps({"done": True}) + "\n\n"
                        
        except asyncio.TimeoutError:
            error_msg = "DeepSeek API timeout"
            print(f"ERROR: {error_msg}")
            yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
        except Exception as e:
            error_msg = f"DeepSeek stream API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
    
    async def call_openai_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Implement true OpenAI API streaming call using aiohttp"""
        if not self.openai_api_key:
            yield "data: " + json.dumps({"error": "OpenAI API key not configured"}) + "\n\n"
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
                        "content": "You are a friendly radio DJ helping people discover radio stations. Based on the user's request, recommend relevant stations and explain why each one fits their needs. At the end of your response, add a line 'RECOMMENDED_STATIONS:' followed by the exact names of the stations you recommended (comma-separated)."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "stream": True
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    
                    print(f"OpenAI stream API response status: {response.status}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        error_msg = f"OpenAI API error: {response.status} - {error_text}"
                        print(f"ERROR: {error_msg}")
                        yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
                        return
                    
                    buffer = ""
                    async for chunk in response.content:
                        if chunk:
                            buffer += chunk.decode('utf-8')
                            lines = buffer.split('\n')
                            buffer = lines.pop() if lines else ""
                            
                            for line in lines:
                                line = line.strip()
                                if line.startswith('data: '):
                                    data_line = line[6:]
                                    
                                    if data_line == '[DONE]':
                                        yield "data: " + json.dumps({"done": True}) + "\n\n"
                                        return
                                    
                                    try:
                                        json_data = json.loads(data_line)
                                        if 'choices' in json_data and json_data['choices']:
                                            delta = json_data['choices'][0].get('delta', {})
                                            if 'content' in delta and delta['content']:
                                                yield "data: " + json.dumps({
                                                    "content": delta['content'],
                                                    "done": False
                                                }) + "\n\n"
                                    except json.JSONDecodeError as e:
                                        print(f"JSON decode error: {e}, data: {data_line}")
                                        continue
                    
                    yield "data: " + json.dumps({"done": True}) + "\n\n"
                        
        except asyncio.TimeoutError:
            error_msg = "OpenAI API timeout"
            print(f"ERROR: {error_msg}")
            yield "data: " + json.dumps({"error": error_msg}) + "\n\n"
        except Exception as e:
            error_msg = f"OpenAI stream API error: {str(e)}"
            print(f"ERROR: {error_msg}")
            yield "data: " + json.dumps({"error": error_msg}) + "\n\n"