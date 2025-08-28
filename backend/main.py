from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
import time
from typing import Optional
from models import ChatMessage, ChatResponse
from faq import get_faq_response

# Import RAG only if available
try:
    from rag import get_rag_response
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    def get_rag_response(message):
        return None
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
                "rag": "operational" if RAG_AVAILABLE and os.getenv("OPENAI_API_KEY") else "disabled"
            }
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(
    message: ChatMessage, 
    api_key: Optional[str] = Depends(verify_api_key)
):
    """
    Main chat endpoint that routes to different response systems
    Phase 1: FAQ responses
    Phase 2: RAG with OpenAI + Pinecone
    """
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
        
        chat_logger.info("Processing chat message", extra={"message": message.message[:100]})
        
        # Phase 1: Try FAQ first
        faq_response = get_faq_response(message.message)
        if faq_response:
            chat_logger.info("FAQ response found")
            return ChatResponse(
                response=faq_response,
                type="faq",
                confidence=0.9,
                session_id=message.session_id
            )
        
        # Phase 2: Fall back to RAG (when available)
        if RAG_AVAILABLE:
            rag_response = await get_rag_response(message.message)
            if rag_response:
                chat_logger.info("RAG response generated")
                return ChatResponse(
                    response=rag_response,
                    type="rag",
                    confidence=0.8,
                    session_id=message.session_id
                )
        
        # Default response
        chat_logger.info("Using default response")
        return ChatResponse(
            response="I'm sorry, I don't have information about that. Please contact our support team for further assistance.",
            type="default",
            confidence=0.1,
            session_id=message.session_id
        )
        
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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    uvicorn.run(app, host="0.0.0.0", port=port, log_level=log_level)
