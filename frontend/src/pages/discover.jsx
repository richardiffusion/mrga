import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Radio, Search, Globe, Sparkles, Music, TrendingUp, Filter } from 'lucide-react';
import AIChatInterface from '@/components/radio/AIChatInterface';
import RadioCard from '@/components/radio/radiocard';
import RadioListItem from '@/components/radio/radiolistItem';
import RadioPlayer from '@/components/radio/radioplayer';

export default function Discover() {
  const [currentStation, setCurrentStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [aiRecommendedStations, setAiRecommendedStations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['radioStations'],
    queryFn: () => apiClient.entities.RadioStation.list('-created_date'),
    initialData: [],
  });

  const genres = [...new Set(stations.map(s => s.genre))].sort();
  const countries = [...new Set(stations.map(s => s.country))].sort();

  // 在 filteredStations 的计算部分，更新搜索逻辑：
  const filteredStations = stations.filter(station => {
    if (!searchQuery && selectedGenre === 'all' && selectedCountry === 'all') {
      return true;
    }
    
    const searchLower = searchQuery.toLowerCase();
    
    // 扩展搜索范围：名称、描述、城市、国家、类型、语言、频率、标签
    const matchesSearch = !searchQuery || 
      station.name.toLowerCase().includes(searchLower) ||
      (station.description && station.description.toLowerCase().includes(searchLower)) ||
      (station.city && station.city.toLowerCase().includes(searchLower)) ||
      station.country.toLowerCase().includes(searchLower) ||
      station.genre.toLowerCase().includes(searchLower) ||
      station.language.toLowerCase().includes(searchLower) ||
      (station.frequency && station.frequency.toLowerCase().includes(searchLower)) ||
      (station.tags && station.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ));
    
    const matchesGenre = selectedGenre === 'all' || station.genre === selectedGenre;
    const matchesCountry = selectedCountry === 'all' || station.country === selectedCountry;
    
    return matchesSearch && matchesGenre && matchesCountry;
  });

  const displayStations = aiRecommendedStations.length > 0 
    ? aiRecommendedStations 
    : filteredStations;

  const handleStationsRecommended = (recommended) => {
    setAiRecommendedStations(recommended);
  };

  const clearAiRecommendations = () => {
    setAiRecommendedStations([]);
  };

  const handlePlayStation = (station) => {
    setCurrentStation(station);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-12 h-12" />
              <h1 className="text-4xl md:text-6xl font-bold">
                MR<span className="text-yellow-300">GA</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Discover radio stations from around the world with AI-powered recommendations.
              Make Radio Great Again!
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>{stations.length} Stations</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>{genres.length} Genres</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{countries.length} Countries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Ask AI for Recommendations
            </h2>
          </div>
          <AIChatInterface 
            onStationsRecommended={handleStationsRecommended}
            allStations={stations}
          />
        </div>

        {aiRecommendedStations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Recommended Stations</h2>
              <Button
                variant="outline"
                onClick={clearAiRecommendations}
                className="text-sm"
              >
                Clear Recommendations
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiRecommendedStations.map((station) => (
                <RadioCard
                  key={station.id}
                  station={station}
                  onPlay={handlePlayStation}
                  isPlaying={currentStation?.id === station.id}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-900">All Stations</h2>
          </div>

          <>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mb-4 md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>

            <div className={`grid gap-4 mb-6 ${showFilters ? 'grid-cols-1' : 'hidden'} md:grid md:grid-cols-4`}>
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stations, genres, countries, languages, tags..."
                  className="pl-10"
                />
              </div>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading stations...</p>
            </div>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No stations found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedGenre !== 'all' || selectedCountry !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding some radio stations!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStations.map((station) => (
              <RadioListItem
                key={station.id}
                station={station}
                onPlay={handlePlayStation}
                isPlaying={currentStation?.id === station.id}
              />
            ))}
          </div>
        )}
      </div>

      {currentStation && (
        <RadioPlayer
          station={currentStation}
          onClose={() => setCurrentStation(null)}
        />
      )}
    </div>
  );
}