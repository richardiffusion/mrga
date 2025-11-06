from typing import List, Optional
from ..data.radio_stations import radio_station_data
from ..models.radio_station import RadioStation

class RadioService:
    def __init__(self):
        self.data = radio_station_data
    
    def get_all_stations(self) -> List[RadioStation]:
        """获取所有电台"""
        return self.data.get_all_stations()
    
    def get_station_by_id(self, station_id: int) -> Optional[RadioStation]:
        """根据 ID 获取电台"""
        return self.data.get_station_by_id(station_id)
    
    def search_stations(self, query: str = None, genre: str = None, country: str = None) -> List[RadioStation]:
        """搜索电台"""
        return self.data.search_stations(query, genre, country)
    
    def get_genres(self) -> List[str]:
        """获取所有音乐类型"""
        return self.data.get_genres()
    
    def get_countries(self) -> List[str]:
        """获取所有国家"""
        return self.data.get_countries()
    
    def get_languages(self) -> List[str]:
        """获取所有语言"""
        return self.data.get_languages()
    
    def add_station(self, station_data: dict) -> RadioStation:
        """添加新电台"""
        return self.data.add_station(station_data)
    
    def update_station(self, station_id: int, station_data: dict) -> RadioStation:
        """更新电台"""
        return self.data.update_station(station_id, station_data)
    
    def delete_station(self, station_id: int) -> bool:
        """删除电台"""
        return self.data.delete_station(station_id)