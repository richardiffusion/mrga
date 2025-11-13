import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Radio, ExternalLink, X, RefreshCw } from 'lucide-react';

export default function RadioPlayer({ station, isPlaying, onPlayPause, onClose }) {
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (station && audioRef.current) {
      setHasError(false);
      setRetryCount(0);
      audioRef.current.src = station.stream_url;
      audioRef.current.volume = volume / 100;
      
      // 根据 isPlaying 状态决定是否自动播放
      if (isPlaying) {
        const playAudio = async () => {
          setIsLoading(true);
          try {
            await audioRef.current.play();
            setHasError(false);
          } catch (error) {
            console.error('Error playing audio:', error);
            setHasError(true);
            setRetryCount(prev => prev + 1);
            // 播放失败时通知父组件暂停
            if (onPlayPause) onPlayPause();
          } finally {
            setIsLoading(false);
          }
        };
        
        playAudio();
      }
    }
  }, [station, isPlaying]); // 添加 isPlaying 依赖

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // 修复：使用正确的函数名 handlePlayPauseClick
  const handlePlayPauseClick = async () => {
    if (!audioRef.current) return;

    // 如果有错误且未超过最大重试次数，尝试重新加载
    if (hasError && retryCount < maxRetries) {
      setHasError(false);
      setIsLoading(true);
      try {
        audioRef.current.load();
        await audioRef.current.play();
        // 通知父组件开始播放
        if (onPlayPause) onPlayPause();
        setHasError(false);
        setRetryCount(0);
      } catch (error) {
        console.error('Error playing audio:', error);
        setHasError(true);
        setRetryCount(prev => prev + 1);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 如果超过最大重试次数，不再尝试播放
    if (hasError && retryCount >= maxRetries) {
      console.log('Max retries reached, giving up');
      return;
    }

    // 切换播放/暂停状态，通知父组件
    if (onPlayPause) onPlayPause();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // 添加音频错误监听器
  useEffect(() => {
    const audioElement = audioRef.current;
    
    const handleAudioError = () => {
      console.log('Audio element error event triggered');
      setHasError(true);
      setIsLoading(false);
      // 当音频元素本身报错时，也增加重试计数
      setRetryCount(prev => {
        const newCount = prev + 1;
        console.log(`Retry count increased to: ${newCount}`);
        return newCount;
      });
      // 播放失败时通知父组件暂停
      if (onPlayPause) onPlayPause();
    };

    if (audioElement) {
      audioElement.addEventListener('error', handleAudioError);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('error', handleAudioError);
      }
    };
  }, [onPlayPause]);

  // 当重试次数达到最大值时，禁用播放按钮
  const isPlayButtonDisabled = hasError && retryCount >= maxRetries;

  if (!station) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <Card className="max-w-6xl mx-auto bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 text-white border-0 shadow-2xl">
        <CardContent className="p-4 md:p-6">
          <audio
            ref={audioRef}
            preload="none"
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
              // 播放失败时通知父组件暂停
              if (onPlayPause) onPlayPause();
            }}
          />

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
              <div className="relative flex-shrink-0">
                {station.image_url && !imageError ? (
                  <img
                    src={station.image_url}
                    alt={station.name}
                    onError={() => setImageError(true)}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Radio className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                )}
                {isPlaying && !hasError && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                )}
                {hasError && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-lg truncate">{station.name}</h3>
                <p className="text-xs md:text-sm text-white/70 truncate">
                  {station.city ? `${station.city}, ` : ''}{station.country} • {station.genre}
                </p>
                {/* 状态消息 */}
                {hasError && (
                  <p className="text-xs text-red-400 mt-1">
                    {retryCount >= maxRetries 
                      ? 'Station unavailable. Please try another station.' 
                      : `Playback failed (${retryCount}/${maxRetries} retries), click to retry`}
                  </p>
                )}
                {isLoading && (
                  <p className="text-xs text-yellow-400 mt-1">Loading...</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                onClick={handlePlayPauseClick} // 修复：使用正确的函数名
                disabled={isLoading || isPlayButtonDisabled}
                className={`rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${
                  hasError 
                    ? retryCount >= maxRetries 
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white hover:bg-white/90 text-purple-600'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : hasError && retryCount < maxRetries ? (
                  <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                ) : hasError && retryCount >= maxRetries ? (
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                ) : isPlaying ? (
                  <span className="text-lg font-bold">❚❚</span>
                ) : (
                  <span className="text-lg font-bold ml-1">▶</span>
                )}
              </Button>

              {/* 音量控制 */}
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={([value]) => {
                    setVolume(value);
                    if (value > 0) setIsMuted(false);
                  }}
                  max={100}
                  step={1}
                  className="w-24"
                />
              </div>

              {/* 网站链接 */}
              {station.website && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-white hover:bg-white/10 hidden md:flex"
                >
                  <a href={station.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </Button>
              )}

              {/* 关闭按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}