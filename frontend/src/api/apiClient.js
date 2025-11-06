// 简化的 API 客户端，使用我们自己的后端
const API_BASE = 'http://localhost:8000';

const apiClient = {
  entities: {
    RadioStation: {
      list: async (sort = '-created_date') => {
        try {
          const response = await fetch(`${API_BASE}/api/radio-stations`);
          if (!response.ok) {
            throw new Error('Failed to fetch radio stations');
          }
          return await response.json();
        } catch (error) {
          console.error('Error fetching radio stations:', error);
          return getSampleStations();
        }
      }
    }
  },
  // 移除旧的 InvokeLLM 方法，因为现在我们在组件中直接调用
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        // 这个方法不再使用，保留只是为了兼容性
        throw new Error('Use direct API call in component instead');
      }
    }
  }
};

// 备用示例数据
const getSampleStations = () => [
  {
    id: 1,
    name: "BBC Radio 1",
    description: "The world's most famous radio station playing the latest hits",
    country: "UK",
    city: "London",
    genre: "Pop",
    language: "English",
    stream_url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
    website: "https://www.bbc.co.uk/sounds/play/live:bbc_radio_one",
    image_url: "https://static.bbc.co.uk/radio/station/images/base/64/c5/bbc_radio_one.png",
    frequency: "97-99 FM",
    tags: ["pop", "hits", "chart", "new music"],
    is_ai_generated: false
  },
  {
    id: 2,
    name: "KEXP 90.3 FM",
    description: "Seattle's influential public radio station championing musical discovery",
    country: "USA",
    city: "Seattle",
    genre: "Alternative",
    language: "English",
    stream_url: "https://kexp-streams.akamaized.net/stream/1/",
    website: "https://www.kexp.org",
    image_url: "https://www.kexp.org/static/assets/img/kexp-logo-square.png",
    frequency: "90.3 FM",
    tags: ["alternative", "indie", "discovery", "live sessions"],
    is_ai_generated: false
  }
];

export { apiClient };