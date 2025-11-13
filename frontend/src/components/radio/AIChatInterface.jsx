import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, Loader2, Settings, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/markdown'; // 新增导入

export default function AIChatInterface({ onStationsRecommended, onRequestStart, allStations }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hey there! 👋 Tell me what kind of radio station you\'re in the mood for - maybe a genre, country, vibe, or even how you\'re feeling right now!'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('deepseek');
  const [showSettings, setShowSettings] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatHeight, setChatHeight] = useState(320); // 默认高度
  const [isResizing, setIsResizing] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const resizeRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 修正拖拽逻辑：向上拖拽增加高度，向下拖拽减少高度
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = chatHeight;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 修正：向上拖拽（deltaY为负）应该增加高度，向下拖拽（deltaY为正）应该减少高度
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY)); // 改为加法
      setChatHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chatHeight]);

  // 修正触摸设备拖拽逻辑
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.touches[0].clientY;
    const startHeight = chatHeight;

    const handleTouchMove = (moveEvent) => {
      const deltaY = moveEvent.touches[0].clientY - startY;
      // 修正：向上拖拽（deltaY为负）应该增加高度，向下拖拽（deltaY为正）应该减少高度
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY)); // 改为加法
      setChatHeight(newHeight);
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      setIsResizing(false);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [chatHeight]);

  // 修复 API 基础 URL 配置
  const getApiBaseUrl = () => {
    // 开发环境
    if (import.meta.env.DEV) {
      return 'http://localhost:8000';
    }
    // 生产环境 - 使用相对路径
    return '';
  };

  const API_BASE_URL = getApiBaseUrl();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingMessage('');
    setIsExpanded(true);
    
    if (onRequestStart) {
      onRequestStart();
    }

    try {
      const apiUrl = import.meta.env.DEV 
        ? `${API_BASE_URL}/api/ai/chat-stream`
        : '/mrga/api/ai/chat-stream';

      console.log('Making AI stream request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          provider: aiProvider
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        // 解码数据
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;
              
              const data = JSON.parse(dataStr);
              console.log('Received data:', data);

              if (data.error) {
                console.error('Stream error:', data.error);
                throw new Error(data.error);
              }

              if (data.content) {
                fullResponse += data.content;
                console.log('Accumulated content:', fullResponse);

                // 直接更新流式消息，不添加延迟
                setStreamingMessage(fullResponse);
              }

              if (data.done) {
                console.log('Stream transmission ended');
                
                // 处理最终结果
                const responseParts = fullResponse.split('RECOMMENDED_STATIONS:');
                const aiMessage = responseParts[0].trim();
                
                let recommendedStations = [];
                if (responseParts.length > 1) {
                  const stationNames = responseParts[1].trim().split(',').map(s => s.trim());
                  recommendedStations = allStations.filter(station => 
                    stationNames.some(name => 
                      station.name.toLowerCase().includes(name.toLowerCase()) || 
                      name.toLowerCase().includes(station.name.toLowerCase())
                    )
                  );
                }

                setMessages(prev => [...prev, { 
                  role: 'assistant', 
                  content: aiMessage,
                  provider: aiProvider
                }]);
                
                if (recommendedStations.length > 0) {
                  onStationsRecommended(recommendedStations);
                }
                
                return; // 直接返回，不继续循环
              }
            } catch (e) {
              console.warn('Parse warning:', e, 'Data:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('AI stream request failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Oops! Had a little technical difficulty there. Error: ${error.message}` 
      }]);
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
    }
  };
    
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 动态计算最小高度
  const getMinHeight = () => {
    if (!isExpanded && !streamingMessage) {
      return 'auto';
    }
    return `${chatHeight}px`;
  };

  return (
    <Card 
      className="w-full flex flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-200 shadow-lg transition-all duration-300 overflow-hidden"
      style={{ minHeight: getMinHeight() }}
    >
      {/* 简洁的头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Radio Guide</h3>
            <p className="text-xs text-gray-500">
              Powered by {aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {(messages.length > 1 || streamingMessage) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="p-3 border-b bg-white/60">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">AI Provider:</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI GPT-3.5</option>
            </select>
          </div>
        </div>
      )}

      {/* 消息区域 - 修改消息渲染部分 */}
      {(isExpanded || streamingMessage) && (messages.length > 1 || streamingMessage) && (
        <>
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ maxHeight: chatHeight - 140 }}
          >
            {messages.slice(-6).map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-800'
                  }`}
                >
                  {message.role === 'user' ? (
                    // 用户消息保持纯文本
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    // AI 消息使用 Markdown 渲染
                    <div className="text-sm prose prose-sm max-w-none">
                      <MarkdownRenderer>
                        {message.content}
                      </MarkdownRenderer>
                    </div>
                  )}
                  {message.role === 'assistant' && message.provider && (
                    <p className="text-xs text-gray-500 mt-1">
                      via {message.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {/* 流式消息显示 - 同样使用 Markdown 渲染 */}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border-2 border-gray-200 text-gray-800">
                  <div className="text-sm prose prose-sm max-w-none">
                    <MarkdownRenderer>
                      {streamingMessage}
                    </MarkdownRenderer>
                    <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    via {aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek'} • 正在推荐...
                  </p>
                </div>
              </div>
            )}
            
            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-600">
                    Connecting to {aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek'}...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 可拖拽调整高度的条 */}
          <div
            ref={resizeRef}
            className={`h-2 cursor-row-resize bg-gradient-to-r from-transparent via-purple-200 to-transparent flex items-center justify-center transition-all ${
              isResizing ? 'bg-purple-300' : 'hover:bg-purple-100'
            }`}
            onMouseDown={handleResizeStart}
            onTouchStart={handleTouchStart}
          >
            <GripHorizontal className="w-4 h-4 text-purple-400" />
          </div>
        </>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try: 'Jazz from Paris' or 'Upbeat morning music'"
              className="flex-1 border-2 border-purple-200 focus:border-purple-400 h-12 text-base"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            AI Chatbox - Ask for radio station recommendations
            {isExpanded && " • Drag the bar above to resize"}
          </p>
        </div>
      </div>
    </Card>
  );
}