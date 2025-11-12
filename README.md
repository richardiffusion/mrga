# MRGA - Make Radio Great Again

A modern online radio station discovery platform that helps users find radio stations from around the world through AI-powered conversations.

## 🚀 Features

- **AI Smart Recommendations**: Natural language conversations with AI to find perfect radio stations
- **Streaming Responses**: Real-time typing effect with streamed AI responses
- **Multiple AI Providers**: Support for DeepSeek (primary) and OpenAI
- **Built-in Audio Player**: Play/pause controls and volume adjustment
- **Smart Search**: Full-text search across station names, descriptions, cities, countries, genres, languages, frequencies, and tags
- **Filtering**: Filter by music genre and country
- **Responsive Design**: Optimized for both desktop and mobile devices

v 0.3.0
<img width="1786" height="1962" alt="image" src="https://github.com/user-attachments/assets/8773691d-dc33-4f3d-88c4-fef787953c47" />

## 🛠 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- React Query
- Lucide React Icons

### Backend
- FastAPI (Python)
- Uvicorn ASGI Server
- Pydantic Data Validation
- Streaming Response Support

## 📋 Prerequisites

- Python 3.12+ (recommended for best compatibility)
- Node.js (latest LTS version recommended)
- API keys for:
  - DeepSeek API
  - OpenAI API (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mrga
```

### 2. Backend Setup
Using Python 3.12 (Recommended)
```bash
cd backend

# Create new virtual environment with Python 3.12
py -3.12 -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# For macOS/Linux:
source venv/bin/activate

# Verify Python version
python --version
# Should display: Python 3.12.*

# Install dependencies
pip install -r requirements.txt
```

Alternative: Using existing Python installation
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_optional
```

### 4. Start the Backend Server
Option 1: Using the run script
```bash
# Make sure you're in the virtual environment
venv\Scripts\activate  # Windows

# Start backend
python run.py
```

Option 2: Using uvicorn directly
```bash
# Make sure you're in the virtual environment
venv\Scripts\activate  # Windows

uvicorn app.main:app --reload --port 8000
```

### 5. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📁 Project Structure
```txt
mrga/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── ui/         # Base UI components
│   │   │   └── radio/      # Radio-specific components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API client
│   │   └── lib/            # Utility functions
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Main application file
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── data/           # Data layer
└── README.md
```
## 🔧 API Configuration
The application supports multiple AI providers:
1. DeepSeek (Primary): Set DEEPSEEK_API_KEY in your environment variables
2. OpenAI (Fallback): Set OPENAI_API_KEY for additional support

## 📝 Notes
- Ensure Python 3.12+ is installed for optimal compatibility
- Keep API keys secure and never commit them to version control
- The application uses a virtual environment to manage Python dependencies
- Both frontend and backend need to be running for full functionality

## 🤝 Contributing
- Fork the repository
- Create a feature branch
- Commit your changes
- Push to the branch
- Create a Pull Request
