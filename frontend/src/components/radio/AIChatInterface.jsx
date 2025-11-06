import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, Loader2, Settings } from 'lucide-react';

export default function AIChatInterface({ onStationsRecommended, allStations }) {
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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // 检查用户是否手动滚动
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // 距离底部小于100px
    
    if (!isAtBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }
  };

  // 智能滚动函数 - 只在用户没有手动滚动时滚动到底部
  const smartScrollToBottom = () => {
    if (!userHasScrolled && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // 强制滚动到底部（用于新消息发送时）
  const forceScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setUserHasScrolled(false);
    }
  };

  useEffect(() => {
    // 初始化和消息更新时智能滚动
    smartScrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 流式消息更新时智能滚动
    if (streamingMessage) {
      smartScrollToBottom();
    }
  }, [streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingMessage('');
    
    // 发送新消息时强制滚动到底部
    setTimeout(forceScrollToBottom, 100);

    try {
      // 使用流式 API
      const response = await fetch('http://localhost:8000/api/ai/chat-stream', {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // 流式传输完成，处理最终结果
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

    } catch (error) {
      console.error('AI stream request failed:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Oops! Had a little technical difficulty there. Mind trying again?' 
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

  return (
    <Card className="w-full h-[500px] flex flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50 border-2 border-purple-200 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm rounded-t-lg">
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {showSettings && (
        <div className="p-4 border-b bg-white/60">
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

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message, index) => (
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
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && message.provider && (
                <p className="text-xs text-gray-500 mt-1">
                  via {message.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {/* 流式消息显示 */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white border-2 border-gray-200 text-gray-800">
              <p className="text-sm whitespace-pre-wrap">
                {streamingMessage}
                <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse"></span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                via {aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek'} • 正在输入...
                {userHasScrolled && (
                  <span className="ml-2 text-blue-500">
                    (已暂停自动滚动)
                  </span>
                )}
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

      {/* 添加滚动到底部按钮 */}
      {userHasScrolled && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={forceScrollToBottom}
            size="sm"
            className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg"
          >
            滚动到最新消息
          </Button>
        </div>
      )}

      <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try: 'Jazz from Paris' or 'Upbeat morning music'"
            className="flex-1 border-2 border-purple-200 focus:border-purple-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}