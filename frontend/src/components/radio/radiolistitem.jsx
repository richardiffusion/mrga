import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Radio, MapPin, Globe, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function RadioListItem({ station, onPlay, isPlaying, onShowDetail, currentStation }) {
  const [imageError, setImageError] = useState(false);

  const handlePlayClick = (e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发 onShowDetail
    onPlay(station);
  };

  const handleItemClick = () => {
    onShowDetail?.(station);
  };

  // 检查这个电台是否正在播放
  const isThisStationPlaying = currentStation && currentStation.id === station.id && isPlaying;

  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-lg border transition-all hover:shadow-md hover:border-purple-300 cursor-pointer ${
        isThisStationPlaying ? 'bg-purple-50 border-purple-400' : 'bg-white border-gray-200'
      }`}
      onClick={handleItemClick}
    >
      <div className="relative flex-shrink-0">
        {station.image_url && !imageError ? (
          <img
            src={station.image_url}
            alt={station.name}
            onError={() => setImageError(true)}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
            <Radio className="w-6 h-6 text-white" />
          </div>
        )}
        {isThisStationPlaying && (
          <div className="absolute -top-1 -right-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{station.name}</h3>
          {station.is_ai_generated && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{station.city ? `${station.city}, ` : ''}{station.country}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>{station.language}</span>
          </div>
          {station.frequency && (
            <span className="font-medium">{station.frequency}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hidden md:flex">
          {station.genre}
        </Badge>
        <Button
          onClick={handlePlayClick}
          size="sm"
          className={`${
            isThisStationPlaying
              ? 'bg-gradient-to-r from-purple-500 to-blue-500'
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {isThisStationPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </Button>
      </div>
    </div>
  );
}