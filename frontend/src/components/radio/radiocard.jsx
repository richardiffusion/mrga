import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Radio, MapPin, Globe, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function RadioCard({ station, onPlay, isPlaying }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className={`overflow-hidden group cursor-pointer transition-all duration-300 outline-none ${
      isPlaying ? 'ring-4 ring-purple-500 shadow-2xl' : 'hover:shadow-xl'
    }`}>
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400">
        {station.image_url && !imageError ? (
          <img 
            src={station.image_url} 
            alt={station.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400">
            <Radio className="w-20 h-20 text-white/80" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* 修复播放按钮覆盖层 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 rounded-t-lg">
          <Button
            onClick={() => onPlay(station)}
            className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-purple-600 shadow-2xl transition-all duration-300 transform group-hover:scale-100 scale-90 flex items-center justify-center p-0" // 添加 p-0 来移除内边距，并使用 flex 居中
          >
            <Play className="w-8 h-8 fill-current" />
          </Button>
        </div>

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {station.is_ai_generated && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-white text-lg mb-1 line-clamp-1">
            {station.name}
          </h3>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">
              {station.city ? `${station.city}, ` : ''}{station.country}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {station.genre}
          </Badge>
          {station.frequency && (
            <span className="text-xs text-gray-500 font-medium">{station.frequency}</span>
          )}
        </div>

        {station.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {station.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Globe className="w-3 h-3" />
          <span>{station.language}</span>
        </div>

        {station.tags && station.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {station.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Button
          onClick={() => onPlay(station)}
          className={`w-full outline-none focus:outline-none ${
            isPlaying 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          <Play className="w-4 h-4 mr-2" />
          {isPlaying ? 'Now Playing' : 'Play Station'}
        </Button>
      </CardContent>
    </Card>
  );
}