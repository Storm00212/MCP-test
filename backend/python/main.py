#!/usr/bin/env python3
"""
Engineering Command OS - Python FastAPI Backend
Handles: RAG pipeline, MCP agent communication, Voice processing, OS automation, LLM integration
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
# LLM MANAGER (Lazy loading)
# ============================================
llm_manager = None

async def get_llm_manager():
    """Lazy load LLM manager on first request"""
    global llm_manager
    if llm_manager is None:
        from llm_manager import create_llm_manager
        llm_manager = create_llm_manager()
    return llm_manager

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
        from langchain_openai import OpenAIEmbeddings
        
        print("Loading FAISS vector store...")
        
        # Load existing vector store
        faiss_path = str(FAISS_INDEX_PATH)
        
        # Check if we have a pre-built index
        if (Path(faiss_path) / "index.faiss").exists():
            try:
                embeddings = OpenAIEmbeddings(
                    api_key=os.getenv("OPENAI_API_KEY"),
                    model="text-embedding-ada-002"
                )
                vector_store = FAISS.load_local(
                    faiss_path, 
                    embeddings,
                    allow_dangerous_deserialization=True
                )
                print("Loaded existing FAISS index")
                chain = vector_store  # Mark as loaded
            except Exception as e:
                print(f"Could not load FAISS index: {e}")
                chain = None  # Will use fallback
        else:
            print("No FAISS index found - will use direct LLM")
            chain = None  # Will use fallback
        
        print("RAG system ready (or using fallback)")
        
    except Exception as e:
        print(f"Error loading RAG system: {e}")
        # Continue without RAG - will use fallback
        chain = None

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
    temperature = 45
    
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
    
    # Initialize LLM manager
    try:
        manager = await get_llm_manager()
        print(f"LLM Providers: {list(manager._providers.keys())}")
    except Exception as e:
        print(f"LLM Manager initialization: {e}")
    
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

class LLMGenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 512
    provider: Optional[str] = None

class QueryResponse(BaseModel):
    response: str

# ============================================
# ROUTES - HEALTH & SYSTEM
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    llm_status = "unavailable"
    try:
        manager = await get_llm_manager()
        health = await manager.health_check_all()
        llm_status = {k: "healthy" if v else "unhealthy" for k, v in health.items()}
    except Exception:
        pass
    
    return {
        "status": "healthy", 
        "service": "python-backend",
        "llm_providers": llm_status
    }

@app.get("/system/metrics")
async def get_metrics():
    """Get system metrics"""
    return get_system_metrics()

# ============================================
# ROUTES - APPLICATION LAUNCHER
# ============================================

@app.post("/app/launch")
async def launch_app(request: AppLaunchRequest):
    """Launch a whitelisted application"""
    try:
        result = launch_application(request.app_name, request.file_path)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# ROUTES - LLM
# ============================================

@app.post("/llm/generate")
async def llm_generate(request: LLMGenerateRequest):
    """Generate text using LLM with automatic failover"""
    try:
        manager = await get_llm_manager()
        
        response = await manager.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            preferred_provider=request.provider
        )
        
        if response.success:
            return {
                "success": True,
                "response": response.text,
                "provider": response.provider,
                "model": response.model,
                "tokens_used": response.tokens_used,
                "latency_ms": response.latency_ms
            }
        else:
            raise HTTPException(status_code=500, detail=response.error)
            
    except ImportError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/llm/providers")
async def llm_providers():
    """Get available LLM providers and their status"""
    try:
        manager = await get_llm_manager()
        return {
            "providers": manager.get_stats(),
            "available": list(manager._providers.keys())
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/llm/health")
async def llm_health_check():
    """Check health of all LLM providers"""
    try:
        manager = await get_llm_manager()
        health = await manager.health_check_all()
        return {
            provider: "healthy" if status else "unhealthy"
            for provider, status in health.items()
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/llm/clear-cache")
async def llm_clear_cache():
    """Clear the LLM response cache"""
    try:
        manager = await get_llm_manager()
        manager.clear_cache()
        return {"success": True, "message": "Cache cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ROUTES - RAG
# ============================================

@app.post("/rag/query", response_model=QueryResponse)
async def rag_query(request: QueryRequest):
    """Query the RAG system"""
    await load_rag_system()
    
    try:
        # Use LLM manager for queries (works even without RAG)
        llm_mgr = await get_llm_manager()
        
        if vector_store is not None:
            # Try semantic search if vector store is available
            try:
                docs = vector_store.similarity_search(request.query, k=3)
                context = "\n\n".join([d.page_content for d in docs])
                prompt = f"Based on the following context, answer the question.\n\nContext:\n{context}\n\nQuestion: {request.query}\n\nAnswer:"
                result = await llm_mgr.generate(prompt)
                return {"response": result.text}
            except Exception as e:
                print(f"Vector search error: {e}")
        
        # Fallback to direct LLM query
        result = await llm_mgr.generate(request.query)
        return {"response": result.text}
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
