import json
import os
from typing import List, Dict, Any
from pathlib import Path
from ..models.radio_station import RadioStation

class RadioStationData:
    def __init__(self):
        self.data_file = Path(__file__).parent / "radio_stations.json"
        self.stations = self._load_stations_from_file()
    
    def _load_stations_from_file(self) -> List[RadioStation]:
        """从 JSON 文件加载电台数据"""
        try:
            if not self.data_file.exists():
                print(f"Warning: Radio stations data file not found at {self.data_file}")
                return self._get_default_stations()
            
            with open(self.data_file, 'r', encoding='utf-8') as file:
                stations_data = json.load(file)
            
            print(f"Loaded {len(stations_data)} radio stations from file")
            return [RadioStation(**station) for station in stations_data]
            
        except Exception as e:
            print(f"Error loading radio stations from file: {e}")
            return self._get_default_stations()
    
    def _get_default_stations(self) -> List[RadioStation]:
        """获取默认电台数据（备用）"""
        default_stations = [
            {
                "id": 1,
                "name": "BBC Radio 1",
                "description": "The world's most famous radio station playing the latest hits",
                "country": "UK",
                "city": "London",
                "genre": "Pop",
                "language": "English",
                "stream_url": "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
                "website": "https://www.bbc.co.uk/sounds/play/live:bbc_radio_one",
                "image_url": "https://static.bbc.co.uk/radio/station/images/base/64/c5/bbc_radio_one.png",
                "frequency": "97-99 FM",
                "tags": ["pop", "hits", "chart", "new music"],
                "is_ai_generated": False
            }
        ]
        return [RadioStation(**station) for station in default_stations]
    
    def _save_stations_to_file(self):
        """将电台数据保存到 JSON 文件"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as file:
                json.dump(
                    [station.dict() for station in self.stations],
                    file,
                    indent=2,
                    ensure_ascii=False
                )
            print(f"Saved {len(self.stations)} radio stations to file")
        except Exception as e:
            print(f"Error saving radio stations to file: {e}")
    
    def get_all_stations(self) -> List[RadioStation]:
        """获取所有电台"""
        return self.stations
    
    def get_station_by_id(self, station_id: int) -> RadioStation:
        """根据 ID 获取电台"""
        for station in self.stations:
            if station.id == station_id:
                return station
        return None
    
    def search_stations(self, query: str = None, genre: str = None, country: str = None) -> List[RadioStation]:
        """搜索电台"""
        results = self.stations
        
        if query:
            query = query.lower()
            results = [
                s for s in results 
                if query in s.name.lower() 
                or (s.description and query in s.description.lower())
                or (s.city and query in s.city.lower())
                or any(query in tag.lower() for tag in (s.tags or []))
            ]
        
        if genre and genre != 'all':
            results = [s for s in results if s.genre.lower() == genre.lower()]
            
        if country and country != 'all':
            results = [s for s in results if s.country.lower() == country.lower()]
            
        return results
    
    def get_genres(self) -> List[str]:
        """获取所有类型"""
        return sorted(list(set(station.genre for station in self.stations)))
    
    def get_countries(self) -> List[str]:
        """获取所有国家"""
        return sorted(list(set(station.country for station in self.stations)))
    
    def get_languages(self) -> List[str]:
        """获取所有语言"""
        return sorted(list(set(station.language for station in self.stations)))
    
    def add_station(self, station_data: Dict[str, Any]) -> RadioStation:
        """添加新电台"""
        # 生成新 ID
        if self.stations:
            new_id = max(station.id for station in self.stations) + 1
        else:
            new_id = 1
            
        station_data['id'] = new_id
        
        # 确保所有字段都有默认值
        station_data.setdefault('description', '')
        station_data.setdefault('city', '')
        station_data.setdefault('website', '')
        station_data.setdefault('image_url', '')
        station_data.setdefault('frequency', '')
        station_data.setdefault('tags', [])
        station_data.setdefault('is_ai_generated', False)
        
        new_station = RadioStation(**station_data)
        self.stations.append(new_station)
        
        # 保存到文件
        self._save_stations_to_file()
        
        return new_station
    
    def update_station(self, station_id: int, station_data: Dict[str, Any]) -> RadioStation:
        """更新电台"""
        station = self.get_station_by_id(station_id)
        if not station:
            return None
        
        # 更新字段
        for key, value in station_data.items():
            if hasattr(station, key) and key != 'id':  # 不能修改 ID
                setattr(station, key, value)
        
        # 保存到文件
        self._save_stations_to_file()
        
        return station
    
    def delete_station(self, station_id: int) -> bool:
        """删除电台"""
        station = self.get_station_by_id(station_id)
        if not station:
            return False
        
        self.stations.remove(station)
        
        # 保存到文件
        self._save_stations_to_file()
        
        return True

# 创建全局实例
radio_station_data = RadioStationData()