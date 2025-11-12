import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Radio, Search, Globe, Sparkles, Music, TrendingUp, Filter, Loader2, Flame } from 'lucide-react';
import AIChatInterface from '@/components/radio/AIChatInterface';
import RadioListItem from '@/components/radio/radiolistItem';
import RadioPlayer from '@/components/radio/radioplayer';

export default function Discover() {
  const [currentStation, setCurrentStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [aiRecommendedStations, setAiRecommendedStations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [trendingStations, setTrendingStations] = useState([]);
  
  // 简化的分批加载状态 - 使用 useRef 避免重新渲染循环
  const [displayedStations, setDisplayedStations] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const currentPageRef = useRef(0);
  const observerTarget = useRef(null);
  const pageSize = 30;

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['radioStations'],
    queryFn: () => apiClient.entities.RadioStation.list('-created_date'),
    initialData: [],
  });

  const genres = [...new Set(stations.map(s => s.genre))].sort();
  const countries = [...new Set(stations.map(s => s.country))].sort();

  // 使用 useMemo 优化过滤计算，避免不必要的重新计算
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      if (!searchQuery && selectedGenre === 'all' && selectedCountry === 'all') {
        return true;
      }
      
      const searchLower = searchQuery.toLowerCase();
      
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
  }, [stations, searchQuery, selectedGenre, selectedCountry]);

  // 初始化热门电台
  useEffect(() => {
    if (stations.length > 0) {
      const shuffled = [...stations].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      setTrendingStations(selected);
    }
  }, [stations]);

  // 初始化显示电台 - 只在过滤结果变化时重置
  useEffect(() => {
    console.log('Filtered stations changed, resetting pagination');
    const initialStations = filteredStations.slice(0, pageSize);
    setDisplayedStations(initialStations);
    currentPageRef.current = 0;
  }, [filteredStations]); // 只在 filteredStations 变化时重置

  // 计算是否还有更多数据
  const hasMore = useMemo(() => {
    const totalDisplayed = (currentPageRef.current + 1) * pageSize;
    return totalDisplayed < filteredStations.length;
  }, [filteredStations.length]);

  // 加载更多电台的稳定函数
  const loadMoreStations = () => {
    if (isLoadingMore || !hasMore) {
      console.log('Cannot load more: isLoadingMore=', isLoadingMore, 'hasMore=', hasMore);
      return;
    }
    
    console.log('Loading more stations, current page:', currentPageRef.current);
    setIsLoadingMore(true);
    
    // 使用 setTimeout 确保状态更新不会批处理
    setTimeout(() => {
      const nextPage = currentPageRef.current + 1;
      const startIndex = nextPage * pageSize;
      const endIndex = startIndex + pageSize;
      const newStations = filteredStations.slice(startIndex, endIndex);
      
      console.log(`Loading page ${nextPage}: ${startIndex}-${endIndex}, found ${newStations.length} stations`);
      
      if (newStations.length > 0) {
        setDisplayedStations(prev => {
          const updated = [...prev, ...newStations];
          console.log('Updated displayed stations:', updated.length);
          return updated;
        });
        currentPageRef.current = nextPage;
        console.log('Page updated to:', nextPage);
      }
      
      setIsLoadingMore(false);
    }, 100);
  };

  // 简化的 Intersection Observer - 只在必要依赖变化时重新创建
  useEffect(() => {
    if (!observerTarget.current || !hasMore) return;
    
    console.log('Setting up Intersection Observer');
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          console.log('Intersection observed, triggering load');
          loadMoreStations();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const currentTarget = observerTarget.current;
    observer.observe(currentTarget);

    return () => {
      console.log('Cleaning up Intersection Observer');
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore]); // 只在 hasMore 和 isLoadingMore 变化时重新创建

  const handleStationsRecommended = (recommended) => {
    setAiRecommendedStations(recommended);
    setIsAiLoading(false);
  };

  const handleAiRequestStart = () => {
    setIsAiLoading(true);
  };

  const clearAiRecommendations = () => {
    setAiRecommendedStations([]);
  };

  const handlePlayStation = (station) => {
    setCurrentStation(station);
  };

  // 刷新热门电台
  const refreshTrendingStations = () => {
    const shuffled = [...stations].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    setTrendingStations(selected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
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

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧栏 */}
          <div className="lg:w-2/5 xl:w-1/3">
            <div className="space-y-8">
              {/* AI 聊天界面 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Ask AI for Recommendations
                  </h2>
                </div>
                <AIChatInterface 
                  onStationsRecommended={handleStationsRecommended}
                  onRequestStart={handleAiRequestStart}
                  allStations={stations}
                />
              </div>

              {/* AI 推荐电台 */}
              <div className="bg-white rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI Recommended Stations
                  </h3>
                  {aiRecommendedStations.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAiRecommendations}
                      className="text-xs h-8"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="p-6">
                  {isAiLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                        <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-gray-600 mt-4 text-center">
                        AI is finding the perfect stations for you...
                      </p>
                    </div>
                  ) : aiRecommendedStations.length > 0 ? (
                    <div className="space-y-2">
                      {aiRecommendedStations.map((station) => (
                        <RadioListItem
                          key={station.id}
                          station={station}
                          onPlay={handlePlayStation}
                          isPlaying={currentStation?.id === station.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Waiting for AI Recommendations
                      </h4>
                      <p className="text-gray-600 max-w-sm">
                        Ask the AI above for radio station suggestions.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 热门电台板块 */}
              <div className="bg-white rounded-lg border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Trending Now
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshTrendingStations}
                    className="text-xs h-8"
                    title="Refresh trending stations"
                  >
                    <TrendingUp className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="p-4">
                  {trendingStations.length > 0 ? (
                    <div className="space-y-2">
                      {trendingStations.map((station) => (
                        <RadioListItem
                          key={station.id}
                          station={station}
                          onPlay={handlePlayStation}
                          isPlaying={currentStation?.id === station.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Flame className="w-12 h-12 text-orange-200 mb-4" />
                      <p className="text-gray-500">Loading trending stations...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧栏：所有电台 - 使用分批加载 */}
          <div className="lg:w-3/5 xl:w-2/3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">All Stations</h2>
                  <div className="text-sm text-gray-500">
                    Showing {displayedStations.length} of {filteredStations.length} stations
                    {hasMore && ` (${filteredStations.length - displayedStations.length} more available)`}
                  </div>
                </div>

                {/* 搜索和筛选 */}
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="mb-4 md:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>

                  <div className={`grid gap-4 ${showFilters ? 'grid-cols-1' : 'hidden'} md:grid md:grid-cols-4`}>
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
                </div>

                {/* 电台列表 - 分批加载 */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading stations...</p>
                    </div>
                  </div>
                ) : displayedStations.length === 0 ? (
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
                  <>
                    <div className="space-y-2">
                      {displayedStations.map((station) => (
                        <RadioListItem
                          key={station.id}
                          station={station}
                          onPlay={handlePlayStation}
                          isPlaying={currentStation?.id === station.id}
                        />
                      ))}
                    </div>
                    
                    {/* 无限滚动观察目标和加载指示器 */}
                    {hasMore && (
                      <>
                        <div 
                          ref={observerTarget} 
                          className="flex justify-center py-6"
                          style={{ minHeight: '50px' }}
                        >
                          <div className="flex items-center gap-2 text-gray-500">
                            {isLoadingMore && <Loader2 className="w-5 h-5 animate-spin" />}
                            <span>
                              {isLoadingMore 
                                ? 'Loading more stations...' 
                                : 'Click and Scroll to load more stations'}
                            </span>
                          </div>
                        </div>
                        
                        {/* 手动加载按钮 */}
                        <div className="text-center py-4 border-t border-gray-100">
                          <Button
                            onClick={loadMoreStations}
                            disabled={isLoadingMore || !hasMore}
                            variant="outline"
                            className="text-sm"
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              `Load More Stations (${Math.max(pageSize, filteredStations.length - displayedStations.length)} available)`
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                    
                    {!hasMore && displayedStations.length > 0 && (
                      <div className="text-center py-6 border-t border-gray-100">
                        <p className="text-gray-500">
                          You've reached the end! All {displayedStations.length} stations loaded.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RadioPlayer */}
      {currentStation && (
        <RadioPlayer
          station={currentStation}
          onClose={() => setCurrentStation(null)}
        />
      )}
    </div>
  );
}