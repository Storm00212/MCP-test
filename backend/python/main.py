#!/usr/bin/env python3
"""
Engineering Command OS - Python FastAPI Backend
Handles: RAG pipeline, MCP agent communication, Voice processing, OS automation
"""

import asyncio
import json
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================
# DATA PATH CONFIGURATION
# ============================================
DATA_DIR = Path(__file__).parent.parent.parent / "data"
FAISS_INDEX_PATH = Path(__file__).parent.parent.parent / "faiss_index"

# ============================================
# RAG PIPELINE (Lazy loading)
# ============================================
vector_store = None
chain = None

async def load_rag_system():
    """Lazy load RAG system on first request"""
    global vector_store, chain
    
    if chain is not None:
        return
    
    try:
        from langchain_community.vectorstores.faiss import FAISS
        from langchain_openai import OpenAIEmbeddings, ChatOpenAI
        from langchain.chains import RetrievalQAChain
        
        print("Loading FAISS vector store...")
        embeddings = OpenAIEmbeddings(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="text-embedding-ada-002"
        )
        
        vector_store = FAISS.load_local(
            str(FAISS_INDEX_PATH), 
            embeddings,
            allow_dangerous_deserialization=True
        )
        
        model = ChatOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-3.5-turbo",
            temperature=0
        )
        
        chain = RetrievalQAChain.from_llm(model, vector_store.as_retriever())
        print("RAG system ready!")
        
    except Exception as e:
        print(f"Error loading RAG system: {e}")
        raise

# ============================================
# APPLICATION LAUNCHER (Whitelisted)
# ============================================
APP_PATHS = {
    "ltspice": r"C:\Program Files\LTC\LTspiceXVII\XVIIx64.exe",
    "matlab": r"C:\Program Files\MATLAB\R2023a\bin\matlab.exe",
    "proteus": r"C:\Program Files\Labcenter Electronics\Proteus 8 Professional\BIN\PDS.EXE",
    "vscode": r"C:\Program Files\Microsoft VS Code\Code.exe",
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "whatsapp": r"C:\Program Files\WhatsApp\WhatsApp.exe",
    "youtube": None,  # Web URL
}

def launch_application(app_name: str, file_path: Optional[str] = None) -> dict:
    """Launch a whitelisted application"""
    if app_name not in APP_PATHS:
        raise ValueError(f"Application {app_name} is not whitelisted")
    
    if app_name == "youtube":
        # Open YouTube in default browser
        subprocess.run(["cmd", "/c", "start", "https://youtube.com"])
        return {"status": "success", "message": "YouTube opened in browser"}
    
    app_path = APP_PATHS[app_name]
    if not app_path or not Path(app_path).exists():
        raise ValueError(f"Application path not found: {app_path}")
    
    cmd = [app_path]
    if file_path:
        cmd.append(file_path)
    
    subprocess.Popen(cmd, shell=True)
    return {"status": "success", "message": f"{app_name} launched successfully"}

# ============================================
# SYSTEM METRICS
# ============================================
def get_system_metrics() -> dict:
    """Get system metrics (CPU, RAM, Temperature)"""
    import psutil
    
    cpu = psutil.cpu_percent(interval=None)
    ram = psutil.virtual_memory().percent
    temperature = 45  # Default, would need platform-specific code
    
    return {
        "cpu": cpu,
        "ram": ram,
        "temperature": temperature,
        "network": "online"
    }

# ============================================
# FASTAPI APP
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("Engineering Command OS - Python Backend Starting...")
    print(f"Data directory: {DATA_DIR}")
    print(f"FAISS index: {FAISS_INDEX_PATH}")
    yield
    print("Engineering Command OS - Python Backend Shutting Down...")

app = FastAPI(
    title="Engineering Command OS API",
    description="AI-powered engineering command backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================
class QueryRequest(BaseModel):
    query: str

class AppLaunchRequest(BaseModel):
    app_name: str
    file_path: Optional[str] = None

class QueryResponse(BaseModel):
    response: str

# ============================================
# ROUTES
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "python-backend"}

@app.get("/system/metrics")
async def get_metrics():
    """Get system metrics"""
    return get_system_metrics()

@app.post("/app/launch")
async def launch_app(request: AppLaunchRequest):
    """Launch a whitelisted application"""
    try:
        result = launch_application(request.app_name, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/rag/query", response_model=QueryResponse)
async def rag_query(request: QueryRequest):
    """Query the RAG system"""
    await load_rag_system()
    
    if chain is None:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: chain.invoke({"query": request.query})
        )
        return {"response": result.get("result", {}).get("text", str(result))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/load")
async def load_vector_store():
    """Force load the vector store"""
    await load_rag_system()
    return {"status": "loaded", "message": "Vector store loaded successfully"}

# ============================================
# WEBSOCKET FOR REAL-TIME LOGS
# ============================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_message(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
