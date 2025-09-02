"""
Context-aware conversation management for intelligent Q&A
Maintains conversation history and context for better responses
"""

import time
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import logging

logger = logging.getLogger("ai-support-widget.context")

@dataclass
class ConversationMessage:
    """Single message in a conversation"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: float
    confidence: Optional[float] = None
    response_type: Optional[str] = None

@dataclass
class ConversationContext:
    """Complete conversation context"""
    session_id: str
    messages: List[ConversationMessage]
    created_at: float
    last_activity: float
    user_id: Optional[str] = None
    metadata: Optional[Dict] = None

class ContextManager:
    """Manages conversation contexts for context-aware responses"""
    
    def __init__(self, max_sessions: int = 1000, max_messages_per_session: int = 50):
        self.conversations: Dict[str, ConversationContext] = {}
        self.max_sessions = max_sessions
        self.max_messages_per_session = max_messages_per_session
        
    def add_message(self, session_id: str, role: str, content: str, 
                   confidence: Optional[float] = None, response_type: Optional[str] = None,
                   user_id: Optional[str] = None) -> None:
        """Add a message to the conversation context"""
        try:
            current_time = time.time()
            
            # Create new conversation if doesn't exist
            if session_id not in self.conversations:
                self.conversations[session_id] = ConversationContext(
                    session_id=session_id,
                    messages=[],
                    created_at=current_time,
                    last_activity=current_time,
                    user_id=user_id
                )
                logger.info(f"Created new conversation context for session: {session_id}")
            
            conversation = self.conversations[session_id]
            
            # Add message
            message = ConversationMessage(
                role=role,
                content=content,
                timestamp=current_time,
                confidence=confidence,
                response_type=response_type
            )
            
            conversation.messages.append(message)
            conversation.last_activity = current_time
            
            # Limit message history
            if len(conversation.messages) > self.max_messages_per_session:
                conversation.messages = conversation.messages[-self.max_messages_per_session:]
                logger.debug(f"Trimmed conversation history for session: {session_id}")
            
            # Clean up old sessions if needed
            self._cleanup_old_sessions()
            
            logger.debug(f"Added {role} message to session {session_id}: {content[:50]}...")
            
        except Exception as e:
            logger.error(f"Error adding message to context: {str(e)}")
    
    def get_conversation_context(self, session_id: str, max_messages: int = 10) -> List[ConversationMessage]:
        """Get recent conversation context for a session"""
        try:
            if session_id not in self.conversations:
                return []
            
            messages = self.conversations[session_id].messages
            return messages[-max_messages:] if max_messages else messages
            
        except Exception as e:
            logger.error(f"Error retrieving conversation context: {str(e)}")
            return []
    
    def get_conversation_summary(self, session_id: str) -> Optional[str]:
        """Generate a summary of the conversation for context"""
        try:
            if session_id not in self.conversations:
                return None
            
            conversation = self.conversations[session_id]
            
            if len(conversation.messages) < 2:
                return None
            
            # Get recent user messages to understand context
            recent_messages = conversation.messages[-6:]  # Last 6 messages
            user_messages = [msg.content for msg in recent_messages if msg.role == "user"]
            
            if not user_messages:
                return None
            
            # Simple context summary
            if len(user_messages) == 1:
                return f"User previously asked: {user_messages[0][:100]}"
            else:
                topics = ", ".join([msg[:30] + "..." if len(msg) > 30 else msg for msg in user_messages[-3:]])
                return f"Conversation topics: {topics}"
                
        except Exception as e:
            logger.error(f"Error generating conversation summary: {str(e)}")
            return None
    
    def is_follow_up_question(self, session_id: str, current_message: str) -> bool:
        """Determine if current message is a follow-up to previous conversation"""
        try:
            if session_id not in self.conversations:
                return False
            
            conversation = self.conversations[session_id]
            
            if len(conversation.messages) < 2:
                return False
            
            # Check if message contains follow-up indicators
            follow_up_indicators = [
                "what about", "and also", "can you tell me more", "what else",
                "how about", "also", "additionally", "furthermore", "more info",
                "explain", "elaborate", "details", "more about"
            ]
            
            current_lower = current_message.lower()
            return any(indicator in current_lower for indicator in follow_up_indicators)
            
        except Exception as e:
            logger.error(f"Error checking follow-up question: {str(e)}")
            return False
    
    def get_session_stats(self, session_id: str) -> Dict:
        """Get statistics for a conversation session"""
        try:
            if session_id not in self.conversations:
                return {}
            
            conversation = self.conversations[session_id]
            
            user_messages = [msg for msg in conversation.messages if msg.role == "user"]
            assistant_messages = [msg for msg in conversation.messages if msg.role == "assistant"]
            
            # Calculate average confidence
            confidences = [msg.confidence for msg in assistant_messages if msg.confidence is not None]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Response types breakdown
            response_types = defaultdict(int)
            for msg in assistant_messages:
                if msg.response_type:
                    response_types[msg.response_type] += 1
            
            return {
                "total_messages": len(conversation.messages),
                "user_messages": len(user_messages),
                "assistant_messages": len(assistant_messages),
                "session_duration": conversation.last_activity - conversation.created_at,
                "avg_confidence": round(avg_confidence, 3),
                "response_types": dict(response_types),
                "created_at": conversation.created_at,
                "last_activity": conversation.last_activity
            }
            
        except Exception as e:
            logger.error(f"Error getting session stats: {str(e)}")
            return {}
    
    def _cleanup_old_sessions(self) -> None:
        """Remove old sessions to manage memory"""
        try:
            if len(self.conversations) <= self.max_sessions:
                return
            
            # Sort by last activity and remove oldest
            sorted_sessions = sorted(
                self.conversations.items(),
                key=lambda x: x[1].last_activity
            )
            
            sessions_to_remove = len(self.conversations) - self.max_sessions
            for session_id, _ in sorted_sessions[:sessions_to_remove]:
                del self.conversations[session_id]
                logger.debug(f"Removed old session: {session_id}")
                
        except Exception as e:
            logger.error(f"Error during session cleanup: {str(e)}")
    
    def clear_session(self, session_id: str) -> bool:
        """Clear a specific session"""
        try:
            if session_id in self.conversations:
                del self.conversations[session_id]
                logger.info(f"Cleared session: {session_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error clearing session: {str(e)}")
            return False
    
    def get_all_sessions(self) -> List[str]:
        """Get list of all active session IDs"""
        return list(self.conversations.keys())

# Global context manager instance
context_manager = ContextManager()

# Convenience functions
def add_user_message(session_id: str, message: str, user_id: Optional[str] = None):
    """Add a user message to conversation context"""
    context_manager.add_message(session_id, "user", message, user_id=user_id)

def add_assistant_message(session_id: str, message: str, confidence: float, response_type: str):
    """Add an assistant message to conversation context"""
    context_manager.add_message(session_id, "assistant", message, confidence, response_type)

def get_context(session_id: str, max_messages: int = 10) -> List[ConversationMessage]:
    """Get conversation context for a session"""
    return context_manager.get_conversation_context(session_id, max_messages)

def get_summary(session_id: str) -> Optional[str]:
    """Get conversation summary for context"""
    return context_manager.get_conversation_summary(session_id)

def is_follow_up(session_id: str, message: str) -> bool:
    """Check if message is a follow-up question"""
    return context_manager.is_follow_up_question(session_id, message)
