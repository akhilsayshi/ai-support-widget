"""
Pydantic models for request/response schemas
Good practice for FastAPI type safety and documentation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, List
from datetime import datetime
import re

class ChatMessage(BaseModel):
    """Request model for chat messages with enhanced validation"""
    message: str = Field(..., min_length=1, max_length=1000, description="User's message")
    session_id: Optional[str] = Field(None, max_length=50, description="Optional session identifier for tracking conversations")
    user_id: Optional[str] = Field(None, max_length=50, description="Optional user identifier")
    
    @validator('message')
    def validate_message(cls, v):
        """Validate and sanitize message content"""
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        
        # Basic XSS prevention
        dangerous_patterns = ['<script', 'javascript:', 'onclick=', 'onerror=']
        v_lower = v.lower()
        for pattern in dangerous_patterns:
            if pattern in v_lower:
                raise ValueError('Message contains invalid content')
        
        return v.strip()
    
    @validator('session_id')
    def validate_session_id(cls, v):
        """Validate session ID format"""
        if v and not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Session ID contains invalid characters')
        return v
    
    @validator('user_id')
    def validate_user_id(cls, v):
        """Validate user ID format"""
        if v and not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('User ID contains invalid characters')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "What are your pricing plans?",
                "session_id": "session_123",
                "user_id": "user_456"
            }
        }

class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str = Field(..., description="AI-generated response")
    type: Literal["faq", "rag", "default"] = Field(..., description="Type of response generated")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the response")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    session_id: Optional[str] = Field(None, description="Session identifier if provided in request")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Our pricing starts at $29/month for the basic plan...",
                "type": "faq",
                "confidence": 0.9,
                "timestamp": "2024-01-01T12:00:00Z",
                "session_id": "session_123"
            }
        }

class HealthResponse(BaseModel):
    """Health check response model"""
    status: Literal["healthy", "unhealthy"] = Field(..., description="Service health status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")
    services: Optional[dict] = Field(None, description="Status of dependent services")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T12:00:00Z",
                "services": {
                    "database": "connected",
                    "openai": "available",
                    "pinecone": "connected"
                }
            }
        }

class KnowledgeDocument(BaseModel):
    """Model for adding documents to knowledge base"""
    title: str = Field(..., min_length=1, max_length=200, description="Document title")
    content: str = Field(..., min_length=10, max_length=5000, description="Document content")
    source: str = Field(default="manual", description="Source of the document")
    tags: Optional[list[str]] = Field(None, description="Optional tags for categorization")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "How to integrate the widget",
                "content": "To integrate our widget, copy the embed script and paste it into your HTML...",
                "source": "documentation",
                "tags": ["integration", "setup", "javascript"]
            }
        }

class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Validation Error",
                "detail": "Message field is required",
                "timestamp": "2024-01-01T12:00:00Z"
            }
        }

class WidgetConfig(BaseModel):
    """Configuration model for widget customization"""
    theme: Literal["light", "dark", "auto"] = Field(default="light", description="Widget theme")
    primary_color: str = Field(default="#3B82F6", pattern=r"^#[0-9A-Fa-f]{6}$", description="Primary color (hex)")
    position: Literal["bottom-right", "bottom-left", "top-right", "top-left"] = Field(
        default="bottom-right", 
        description="Widget position on page"
    )
    greeting_message: str = Field(
        default="Hi! How can I help you today?", 
        max_length=100,
        description="Initial greeting message"
    )
    placeholder_text: str = Field(
        default="Type your message...", 
        max_length=50,
        description="Input placeholder text"
    )
    show_avatar: bool = Field(default=True, description="Whether to show bot avatar")
    enable_sound: bool = Field(default=False, description="Whether to enable sound notifications")
    
    class Config:
        json_schema_extra = {
            "example": {
                "theme": "light",
                "primary_color": "#3B82F6",
                "position": "bottom-right",
                "greeting_message": "Hello! I'm here to help with any questions.",
                "placeholder_text": "Ask me anything...",
                "show_avatar": True,
                "enable_sound": False
            }
        }
