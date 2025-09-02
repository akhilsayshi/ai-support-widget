"""
Pinecone vector search integration with OpenAI embeddings
Provides semantic retrieval across knowledge base entries
"""

import os
import time
import logging
from typing import List, Dict, Optional, Tuple
import numpy as np
from openai import AsyncOpenAI
import asyncio

logger = logging.getLogger("ai-support-widget.vector_search")

# Try to import Pinecone
try:
    from pinecone import Pinecone, ServerlessSpec
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False
    logger.warning("Pinecone not available. Vector search disabled.")

class VectorSearchManager:
    """Manages vector search operations with Pinecone and OpenAI"""
    
    def __init__(self):
        self.openai_client = None
        self.pinecone_client = None
        self.index = None
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "ai-support-knowledge")
        self.embedding_model = "text-embedding-3-small"  # Cost-effective embedding model
        self.embedding_dimension = 1536
        self.initialized = False
        
    async def initialize(self) -> bool:
        """Initialize OpenAI and Pinecone clients"""
        try:
            # Initialize OpenAI
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                logger.warning("OpenAI API key not found. Vector search disabled.")
                return False
            
            self.openai_client = AsyncOpenAI(api_key=openai_key)
            
            # Initialize Pinecone
            if not PINECONE_AVAILABLE:
                logger.warning("Pinecone library not available. Vector search disabled.")
                return False
                
            pinecone_key = os.getenv("PINECONE_API_KEY")
            if not pinecone_key:
                logger.warning("Pinecone API key not found. Vector search disabled.")
                return False
            
            self.pinecone_client = Pinecone(api_key=pinecone_key)
            
            # Connect to or create index
            await self._setup_index()
            
            self.initialized = True
            logger.info("Vector search initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize vector search: {str(e)}")
            return False
    
    async def _setup_index(self):
        """Setup Pinecone index"""
        try:
            # Check if index exists
            existing_indexes = self.pinecone_client.list_indexes()
            index_names = [idx.name for idx in existing_indexes.indexes]
            
            if self.index_name not in index_names:
                logger.info(f"Creating new Pinecone index: {self.index_name}")
                self.pinecone_client.create_index(
                    name=self.index_name,
                    dimension=self.embedding_dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                # Wait for index to be ready
                await asyncio.sleep(10)
            
            self.index = self.pinecone_client.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Error setting up Pinecone index: {str(e)}")
            raise
    
    async def create_embedding(self, text: str) -> List[float]:
        """Create embedding for text using OpenAI"""
        try:
            if not self.openai_client:
                raise ValueError("OpenAI client not initialized")
            
            # Clean and prepare text
            clean_text = text.strip().replace('\n', ' ')[:8000]  # Limit text length
            
            response = await self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=clean_text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error creating embedding: {str(e)}")
            raise
    
    async def add_knowledge_entry(self, id: str, text: str, metadata: Optional[Dict] = None) -> bool:
        """Add a knowledge entry to the vector database"""
        try:
            if not self.initialized:
                await self.initialize()
            
            if not self.initialized:
                return False
            
            # Create embedding
            embedding = await self.create_embedding(text)
            
            # Prepare metadata
            entry_metadata = {
                "text": text[:1000],  # Store truncated text in metadata
                "timestamp": time.time(),
                **(metadata or {})
            }
            
            # Upsert to Pinecone
            self.index.upsert(vectors=[(id, embedding, entry_metadata)])
            
            logger.debug(f"Added knowledge entry: {id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding knowledge entry: {str(e)}")
            return False
    
    async def search_similar(self, query: str, top_k: int = 5, min_score: float = 0.7) -> List[Dict]:
        """Search for similar knowledge entries"""
        try:
            if not self.initialized:
                await self.initialize()
            
            if not self.initialized:
                return []
            
            # Create query embedding
            query_embedding = await self.create_embedding(query)
            
            # Search in Pinecone
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            # Filter and format results
            results = []
            for match in search_results.matches:
                if match.score >= min_score:
                    results.append({
                        "id": match.id,
                        "text": match.metadata.get("text", ""),
                        "score": match.score,
                        "metadata": match.metadata
                    })
            
            logger.info(f"Found {len(results)} similar entries for query: {query[:50]}...")
            return results
            
        except Exception as e:
            logger.error(f"Error searching similar entries: {str(e)}")
            return []
    
    async def generate_rag_response(self, query: str, context_entries: List[Dict]) -> Optional[str]:
        """Generate response using RAG with context entries"""
        try:
            if not self.openai_client or not context_entries:
                return None
            
            # Prepare context from search results
            context_texts = []
            for entry in context_entries[:3]:  # Use top 3 results
                context_texts.append(f"- {entry['text']}")
            
            context = "\n".join(context_texts)
            
            # Create prompt for GPT
            prompt = f"""You are a helpful customer support assistant. Use the following knowledge base information to answer the user's question. Be concise and helpful.

Knowledge Base Context:
{context}

User Question: {query}

Answer (be concise and helpful, only use information from the context above):"""
            
            # Generate response
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.3
            )
            
            answer = response.choices[0].message.content.strip()
            logger.info(f"Generated RAG response for query: {query[:50]}...")
            
            return answer
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {str(e)}")
            return None
    
    async def get_index_stats(self) -> Dict:
        """Get statistics about the knowledge base"""
        try:
            if not self.initialized:
                return {"status": "not_initialized"}
            
            stats = self.index.describe_index_stats()
            
            return {
                "status": "active",
                "total_vectors": stats.total_vector_count,
                "index_name": self.index_name,
                "dimension": self.embedding_dimension,
                "namespaces": len(stats.namespaces) if stats.namespaces else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting index stats: {str(e)}")
            return {"status": "error", "error": str(e)}

# Global vector search manager
vector_search = VectorSearchManager()

# Convenience functions
async def search_knowledge_base(query: str, top_k: int = 5) -> List[Dict]:
    """Search the knowledge base for relevant entries"""
    return await vector_search.search_similar(query, top_k)

async def add_knowledge(id: str, text: str, metadata: Optional[Dict] = None) -> bool:
    """Add knowledge to the vector database"""
    return await vector_search.add_knowledge_entry(id, text, metadata)

async def get_rag_response(query: str) -> Optional[str]:
    """Get RAG response for a query"""
    # Search for relevant context
    context_entries = await search_knowledge_base(query, top_k=3)
    
    if not context_entries:
        return None
    
    # Generate response using context
    return await vector_search.generate_rag_response(query, context_entries)

async def initialize_vector_search() -> bool:
    """Initialize the vector search system"""
    return await vector_search.initialize()

async def populate_sample_knowledge():
    """Populate the knowledge base with sample entries"""
    sample_entries = [
        {
            "id": "pricing_basic",
            "text": "Our basic plan costs $29/month and includes up to 1,000 conversations, basic analytics, and email support.",
            "metadata": {"category": "pricing", "plan": "basic"}
        },
        {
            "id": "pricing_pro",
            "text": "Our professional plan costs $79/month and includes up to 5,000 conversations, advanced analytics, priority support, and custom branding.",
            "metadata": {"category": "pricing", "plan": "professional"}
        },
        {
            "id": "integration_javascript",
            "text": "To integrate our widget, add this script tag to your website: <script src='widget.js' data-api-key='your-key'></script>. The widget will automatically appear in the bottom right corner.",
            "metadata": {"category": "integration", "type": "javascript"}
        },
        {
            "id": "features_dark_mode",
            "text": "Our widget supports both light and dark modes. The theme automatically adapts to your website's design or can be manually configured.",
            "metadata": {"category": "features", "feature": "dark_mode"}
        },
        {
            "id": "support_hours",
            "text": "Our customer support team is available Monday through Friday, 9 AM to 6 PM EST. Premium customers get 24/7 support.",
            "metadata": {"category": "support", "type": "hours"}
        }
    ]
    
    success_count = 0
    for entry in sample_entries:
        if await add_knowledge(entry["id"], entry["text"], entry["metadata"]):
            success_count += 1
    
    logger.info(f"Populated {success_count}/{len(sample_entries)} sample knowledge entries")
    return success_count == len(sample_entries)
