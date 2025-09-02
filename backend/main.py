from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
import time
from typing import Optional, Dict
from models import ChatMessage, ChatResponse
from faq import get_faq_response
from context_manager import context_manager, add_user_message, add_assistant_message, get_context, is_follow_up
from vector_search import get_rag_response, initialize_vector_search, populate_sample_knowledge, vector_search

# Import RAG only if available
try:
    from rag import get_rag_response as legacy_rag_response
    LEGACY_RAG_AVAILABLE = True
except ImportError:
    LEGACY_RAG_AVAILABLE = False
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def create_scoped_logger(scope: str):
    """Create a scoped logger following MDC guidelines"""
    logger = logging.getLogger(f"ai-support-widget.{scope}")
    return logger

# Global logger
logger = create_scoped_logger("main")

# Security
security = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("Starting AI Support Widget API")
    
    # Initialize vector search system
    try:
        vector_initialized = await initialize_vector_search()
        if vector_initialized:
            logger.info("Vector search system initialized")
            # Populate sample knowledge if index is empty
            stats = await vector_search.get_index_stats()
            if stats.get("total_vectors", 0) == 0:
                await populate_sample_knowledge()
                logger.info("Populated sample knowledge base")
        else:
            logger.warning("Vector search system not available - running in FAQ-only mode")
    except Exception as e:
        logger.error(f"Failed to initialize vector search: {str(e)}")
    
    yield
    logger.info("Shutting down AI Support Widget API")

app = FastAPI(
    title="AI Support Widget API",
    description="Backend API for the AI support widget",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for widget embedding
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",") if os.getenv("ALLOWED_ORIGINS") else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Configurable via environment variable
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication and validation
async def verify_api_key(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Verify API key for widget authentication"""
    # For demo purposes, allow requests without auth
    # In production, implement proper API key validation
    if not credentials:
        return None
    
    api_key = credentials.credentials
    
    # Basic validation - in production, validate against database
    if api_key and len(api_key) >= 10:
        logger.info(f"API key validated: {api_key[:8]}...")
        return api_key
    
    logger.warning(f"Invalid API key attempt: {api_key[:8] if api_key else 'None'}...")
    raise HTTPException(status_code=401, detail="Invalid API key")

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Request/response logging middleware"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}", extra={
        "method": request.method,
        "path": request.url.path,
        "client_ip": request.client.host if request.client else "unknown"
    })
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {process_time:.3f}s", extra={
        "status_code": response.status_code,
        "process_time": process_time
    })
    
    return response

@app.get("/")
async def root():
    """Root endpoint for API status"""
    logger.info("Root endpoint accessed")
    return {"message": "AI Support Widget API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    logger.debug("Health check accessed")
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
                    "services": {
                "api": "operational",
                "faq": "operational",
                "vector_search": "operational" if vector_search.initialized else "disabled",
                "context_aware": "operational",
                "legacy_rag": "operational" if LEGACY_RAG_AVAILABLE and os.getenv("OPENAI_API_KEY") else "disabled"
            }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage, 
    request: Request,
    api_key: Optional[str] = Depends(verify_api_key)
):
    """
    Context-aware chat endpoint with intelligent response routing
    1. FAQ responses for common questions
    2. Vector search with RAG for complex queries
    3. Context-aware follow-up handling
    """
    start_time = time.time()
    chat_logger = create_scoped_logger("chat").bind(
        session_id=message.session_id,
        user_id=message.user_id,
        message_length=len(message.message)
    )
    
    try:
        # Input validation
        if not message.message or len(message.message.strip()) < 1:
            chat_logger.warning("Empty message received")
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        if len(message.message) > 1000:
            chat_logger.warning("Message too long", extra={"length": len(message.message)})
            raise HTTPException(status_code=400, detail="Message too long (max 1000 characters)")
        
        # Add user message to context
        add_user_message(message.session_id, message.message, message.user_id)
        
        chat_logger.info("Processing context-aware chat message", extra={"message": message.message[:100]})
        
        # Check if this is a follow-up question
        is_followup = is_follow_up(message.session_id, message.message)
        if is_followup:
            chat_logger.info("Detected follow-up question")
        
        response_obj = None
        
        # Phase 1: Try FAQ first (unless it's a complex follow-up)
        if not is_followup or len(message.message.split()) < 5:
            faq_response = get_faq_response(message.message)
            if faq_response:
                chat_logger.info("FAQ response found")
                response_obj = ChatResponse(
                    response=faq_response,
                    type="faq",
                    confidence=0.9,
                    session_id=message.session_id
                )
        
        # Phase 2: Try vector search RAG for complex queries or follow-ups
        if not response_obj and vector_search.initialized:
            rag_response = await get_rag_response(message.message)
            if rag_response:
                chat_logger.info("Vector search RAG response generated")
                response_obj = ChatResponse(
                    response=rag_response,
                    type="rag",
                    confidence=0.8,
                    session_id=message.session_id
                )
        
        # Phase 3: Fall back to legacy RAG (if available)
        if not response_obj and LEGACY_RAG_AVAILABLE:
            try:
                legacy_response = await legacy_rag_response(message.message)
                if legacy_response:
                    chat_logger.info("Legacy RAG response generated")
                    response_obj = ChatResponse(
                        response=legacy_response,
                        type="legacy_rag",
                        confidence=0.7,
                        session_id=message.session_id
                    )
            except Exception as e:
                chat_logger.warning(f"Legacy RAG failed: {str(e)}")
        
        # Default response
        if not response_obj:
            chat_logger.info("Using default response")
            response_obj = ChatResponse(
                response="I'm sorry, I don't have specific information about that. Please contact our support team for further assistance.",
                type="default",
                confidence=0.1,
                session_id=message.session_id
            )
        
        # Add assistant response to context
        add_assistant_message(
            message.session_id, 
            response_obj.response, 
            response_obj.confidence, 
            response_obj.type
        )
        
        # Calculate response time
        response_time = (time.time() - start_time) * 1000
        chat_logger.info(f"Response generated in {response_time:.2f}ms", extra={
            "response_time_ms": response_time,
            "response_type": response_obj.type,
            "confidence": response_obj.confidence
        })
        
        return response_obj
        
    except HTTPException:
        raise
    except Exception as e:
        chat_logger.error("Unexpected error processing chat", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

# Add a bound logger method to the logger class for easier use
class BoundLogger:
    def __init__(self, logger, **kwargs):
        self.logger = logger
        self.context = kwargs
    
    def info(self, message, extra=None):
        self.logger.info(message, extra={**self.context, **(extra or {})})
    
    def warning(self, message, extra=None):
        self.logger.warning(message, extra={**self.context, **(extra or {})})
    
    def error(self, message, extra=None):
        self.logger.error(message, extra={**self.context, **(extra or {})})
    
    def debug(self, message, extra=None):
        self.logger.debug(message, extra={**self.context, **(extra or {})})

# Monkey patch the bind method
def bind(self, **kwargs):
    return BoundLogger(self, **kwargs)

# Add bind method to logger
logger.__class__.bind = bind

# Additional API endpoints for enhanced functionality

@app.get("/analytics/sessions")
async def get_session_analytics():
    """Get analytics about active sessions"""
    try:
        sessions = context_manager.get_all_sessions()
        session_stats = []
        
        for session_id in sessions[-10:]:  # Last 10 sessions
            stats = context_manager.get_session_stats(session_id)
            if stats:
                session_stats.append({
                    "session_id": session_id,
                    **stats
                })
        
        return {
            "total_active_sessions": len(sessions),
            "recent_sessions": session_stats,
            "timestamp": int(time.time())
        }
    except Exception as e:
        logger.error(f"Error getting session analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session analytics")

@app.get("/knowledge/stats")
async def get_knowledge_stats():
    """Get statistics about the knowledge base"""
    try:
        stats = await vector_search.get_index_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting knowledge stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve knowledge stats")

@app.post("/knowledge/add")
async def add_knowledge_entry(
    entry_id: str,
    text: str,
    metadata: Optional[Dict] = None,
    api_key: Optional[str] = Depends(verify_api_key)
):
    """Add a new knowledge entry to the vector database"""
    try:
        if not vector_search.initialized:
            raise HTTPException(status_code=503, detail="Vector search not available")
        
        success = await vector_search.add_knowledge_entry(entry_id, text, metadata)
        
        if success:
            logger.info(f"Added knowledge entry: {entry_id}")
            return {"status": "success", "id": entry_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to add knowledge entry")
            
    except Exception as e:
        logger.error(f"Error adding knowledge entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add knowledge entry")

@app.get("/performance/metrics")
async def get_performance_metrics():
    """Get performance metrics for monitoring"""
    try:
        # Simple performance metrics
        import psutil
        
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:').percent,
            "active_sessions": len(context_manager.get_all_sessions()),
            "vector_search_status": "active" if vector_search.initialized else "inactive",
            "timestamp": int(time.time())
        }
    except ImportError:
        # Fallback if psutil not available
        return {
            "active_sessions": len(context_manager.get_all_sessions()),
            "vector_search_status": "active" if vector_search.initialized else "inactive",
            "timestamp": int(time.time())
        }
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve performance metrics")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    uvicorn.run(app, host="0.0.0.0", port=port, log_level=log_level)
