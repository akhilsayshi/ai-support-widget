"""
Phase 2: RAG (Retrieval-Augmented Generation) with OpenAI + Pinecone
This module handles more complex queries using vector search and LLM generation
Following MDC LLM implementation guidelines
"""

import os
import openai
import pinecone
from typing import Optional, List, Dict
import json
import asyncio
from datetime import datetime
import logging
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Setup logging following MDC guidelines
def create_scoped_logger(scope: str):
    """Create a scoped logger following MDC guidelines"""
    logger = logging.getLogger(f"ai-support-widget.{scope}")
    return logger

logger = create_scoped_logger("rag")

# Initialize OpenAI (set your API key as environment variable)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Pinecone (set your API key and environment as environment variables)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "support-knowledge")

# Response models for validation
class RAGContext(BaseModel):
    content: str
    title: str
    score: float
    source: str

class RAGResponse(BaseModel):
    answer: str
    confidence: float
    sources_used: List[str]

class RAGSystem:
    def __init__(self):
        self.index = None
        self.initialized = False
        
    async def initialize(self):
        """Initialize Pinecone connection with proper logging"""
        try:
            if PINECONE_API_KEY:
                logger.info("Initializing Pinecone connection")
                pinecone.init(
                    api_key=PINECONE_API_KEY,
                    environment=PINECONE_ENVIRONMENT
                )
                
                # Check if index exists, create if not
                if PINECONE_INDEX_NAME not in pinecone.list_indexes():
                    logger.info(f"Creating new Pinecone index: {PINECONE_INDEX_NAME}")
                    pinecone.create_index(
                        name=PINECONE_INDEX_NAME,
                        dimension=1536,  # OpenAI ada-002 embedding dimension
                        metric="cosine"
                    )
                
                self.index = pinecone.Index(PINECONE_INDEX_NAME)
                self.initialized = True
                logger.info(f"RAG system initialized with index: {PINECONE_INDEX_NAME}")
            else:
                logger.warning("PINECONE_API_KEY not found. RAG system will use fallback responses.")
        except Exception as e:
            logger.error(f"Error initializing RAG system: {e}")
            self.initialized = False
    
    async def get_embedding(self, text: str) -> List[float]:
        """Get OpenAI embedding for text with proper logging"""
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return []
        
        try:
            if not openai.api_key:
                logger.warning("OpenAI API key not configured")
                return []
            
            logger.debug(f"Getting embedding for text: {text[:50]}...")
            response = await openai.Embedding.acreate(
                model="text-embedding-ada-002",
                input=text.strip()
            )
            embedding = response['data'][0]['embedding']
            logger.debug(f"Successfully generated embedding with dimension: {len(embedding)}")
            return embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return []
    
    async def search_knowledge_base(self, query: str, top_k: int = 3) -> List[Dict]:
        """Search knowledge base using vector similarity"""
        try:
            if not self.initialized or not self.index:
                return []
            
            # Get query embedding
            query_embedding = await self.get_embedding(query)
            if not query_embedding:
                return []
            
            # Search Pinecone
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            # Format results
            results = []
            for match in search_results['matches']:
                if match['score'] > 0.7:  # Relevance threshold
                    results.append({
                        'content': match['metadata'].get('content', ''),
                        'title': match['metadata'].get('title', ''),
                        'score': match['score'],
                        'source': match['metadata'].get('source', '')
                    })
            
            return results
        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            return []
    
    async def generate_response(self, query: str, context_docs: List[Dict]) -> Optional[str]:
        """Generate response using OpenAI with retrieved context"""
        try:
            if not openai.api_key:
                return None
            
            # Prepare context from retrieved documents
            context = "\n\n".join([
                f"Title: {doc['title']}\nContent: {doc['content']}"
                for doc in context_docs
            ])
            
            # Create prompt
            system_prompt = """You are a helpful customer support assistant. Use the provided context to answer the user's question accurately and helpfully. If the context doesn't contain enough information to answer the question, say so politely and suggest contacting support."""
            
            user_prompt = f"""Context:
{context}

Question: {query}

Please provide a helpful and accurate response based on the context above."""

            # Get response from OpenAI
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating response: {e}")
            return None

# Global RAG system instance
rag_system = RAGSystem()

async def get_rag_response(message: str) -> Optional[str]:
    """
    Main function to get RAG response for a user message following MDC LLM guidelines
    
    Args:
        message: User's input message
        
    Returns:
        Generated response or None if RAG is not available
    """
    # Input validation
    if not message or len(message.strip()) < 2:
        logger.warning("Invalid input for RAG response")
        return None
    
    rag_logger = logger.bind(message_length=len(message))
    
    try:
        rag_logger.info("Processing RAG request")
        
        # Initialize if not already done
        if not rag_system.initialized:
            await rag_system.initialize()
        
        # If still not initialized, return None (will fall back to default response)
        if not rag_system.initialized:
            rag_logger.warning("RAG system not available")
            return None
        
        # Search knowledge base
        relevant_docs = await rag_system.search_knowledge_base(message)
        
        # If no relevant documents found, return None
        if not relevant_docs:
            rag_logger.info("No relevant documents found")
            return None
        
        rag_logger.info(f"Found {len(relevant_docs)} relevant documents")
        
        # Generate response using retrieved context
        response = await rag_system.generate_response(message, relevant_docs)
        
        if response:
            rag_logger.info("RAG response generated successfully")
        else:
            rag_logger.warning("Failed to generate RAG response")
            
        return response
        
    except Exception as e:
        rag_logger.error(f"Error in RAG response: {e}")
        return None

# Add bound logger functionality (similar to main.py)
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

async def add_knowledge_document(title: str, content: str, source: str = "manual"):
    """
    Add a document to the knowledge base
    
    Args:
        title: Document title
        content: Document content
        source: Source of the document
    """
    try:
        if not rag_system.initialized:
            await rag_system.initialize()
        
        if not rag_system.initialized or not rag_system.index:
            print("RAG system not available for adding documents")
            return False
        
        # Get embedding for the content
        embedding = await rag_system.get_embedding(content)
        if not embedding:
            return False
        
        # Create document ID
        doc_id = f"{source}_{datetime.now().isoformat()}_{hash(title)}"
        
        # Upsert to Pinecone
        rag_system.index.upsert([
            {
                "id": doc_id,
                "values": embedding,
                "metadata": {
                    "title": title,
                    "content": content,
                    "source": source,
                    "created_at": datetime.now().isoformat()
                }
            }
        ])
        
        print(f"Added document to knowledge base: {title}")
        return True
        
    except Exception as e:
        print(f"Error adding document: {e}")
        return False

# Sample knowledge base initialization (you can expand this)
SAMPLE_KNOWLEDGE_BASE = [
    {
        "title": "Getting Started Guide",
        "content": "To get started with our platform, first create an account, then configure your widget settings in the dashboard. The widget can be embedded using our JavaScript snippet.",
        "source": "documentation"
    },
    {
        "title": "API Rate Limits",
        "content": "Our API has rate limits of 1000 requests per minute for basic plans and 5000 requests per minute for premium plans. If you exceed these limits, you'll receive a 429 status code.",
        "source": "documentation"
    },
    {
        "title": "Webhook Configuration",
        "content": "Webhooks can be configured in your dashboard under Settings > Integrations. We support POST requests with JSON payloads. Make sure your endpoint returns a 200 status code.",
        "source": "documentation"
    }
]

async def initialize_sample_knowledge_base():
    """Initialize the knowledge base with sample documents"""
    print("Initializing sample knowledge base...")
    for doc in SAMPLE_KNOWLEDGE_BASE:
        await add_knowledge_document(
            title=doc["title"],
            content=doc["content"],
            source=doc["source"]
        )
