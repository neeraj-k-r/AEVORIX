"""
RAG Pipeline for Medical Query
Converts patient EHR data to vector embeddings and retrieves relevant context for LLM queries.
"""
import json
import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import httpx

from config import settings


class RAGPipeline:
    """
    Retrieval-Augmented Generation pipeline for medical queries.
    """
    
    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        embedding_dim: int = 384,
        top_k: int = 5,
        similarity_threshold: float = 0.3,
        gemini_api_key: str = "",
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "llama3:8b",
    ):
        self.embedding_dim = embedding_dim
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold
        self.ollama_base_url = ollama_base_url
        self.ollama_model = ollama_model
        
        # Initialize embedding model
        self.encoder = SentenceTransformer(embedding_model)
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(embedding_dim)  # Inner product for cosine similarity
        
        # Document storage
        self.documents: List[Dict[str, Any]] = []
        self.document_embeddings: Optional[np.ndarray] = None
        
        # Initialize LLM
        self.gemini_model = None
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
        
        self._initialized = False
    
    def _create_documents_from_records(
        self, 
        patient_code: str, 
        records: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Convert patient records to structured documents for retrieval"""
        documents = []
        
        # Diagnosis documents
        for diag in records.get("diagnoses", []):
            content = f"Diagnosis: {diag.get('condition_name', 'Unknown')} " \
                     f"diagnosed on {diag.get('diagnosed_date', 'Unknown date')}. " \
                     f"Recorded by {diag.get('recorded_by', {}).get('full_name', 'Unknown')} " \
                     f"({diag.get('recorded_by', {}).get('role', 'Unknown')})."
            if diag.get('sha256_hash'):
                content += f" [Blockchain verified: {diag['sha256_hash'][:16]}...]"
            
            documents.append({
                "id": f"diag_{diag.get('id', 'unknown')}",
                "patient_code": patient_code,
                "type": "diagnosis",
                "content": content,
                "metadata": {
                    "condition_name": diag.get('condition_name'),
                    "diagnosed_date": diag.get('diagnosed_date'),
                    "record_id": diag.get('id'),
                    "sha256_hash": diag.get('sha256_hash'),
                    "blockchain_tx_id": diag.get('blockchain_tx_id'),
                }
            })
        
        # Prescription documents
        for rx in records.get("prescriptions", []):
            content = f"Prescription: {rx.get('medication_name', 'Unknown')} " \
                     f"- {rx.get('dosage_instructions', 'No instructions')}. " \
                     f"Prescribed by {rx.get('prescribed_by', {}).get('full_name', 'Unknown')} " \
                     f"({rx.get('prescribed_by', {}).get('role', 'Unknown')})."
            if rx.get('sha256_hash'):
                content += f" [Blockchain verified: {rx['sha256_hash'][:16]}...]"
            
            documents.append({
                "id": f"rx_{rx.get('id', 'unknown')}",
                "patient_code": patient_code,
                "type": "prescription",
                "content": content,
                "metadata": {
                    "medication_name": rx.get('medication_name'),
                    "dosage_instructions": rx.get('dosage_instructions'),
                    "record_id": rx.get('id'),
                    "sha256_hash": rx.get('sha256_hash'),
                    "blockchain_tx_id": rx.get('blockchain_tx_id'),
                }
            })
        
        # Lab result documents
        for lab in records.get("lab_results", []):
            content = f"Lab Result: {lab.get('test_name', 'Unknown')} " \
                     f"- Result: {lab.get('result_value', 'Unknown')}. "
            if lab.get('target_range'):
                content += f"Target range: {lab['target_range']}. "
            content += f"Recorded by {lab.get('recorded_by', {}).get('full_name', 'Unknown')} " \
                      f"({lab.get('recorded_by', {}).get('role', 'Unknown')})."
            if lab.get('sha256_hash'):
                content += f" [Blockchain verified: {lab['sha256_hash'][:16]}...]"
            
            documents.append({
                "id": f"lab_{lab.get('id', 'unknown')}",
                "patient_code": patient_code,
                "type": "lab_result",
                "content": content,
                "metadata": {
                    "test_name": lab.get('test_name'),
                    "result_value": lab.get('result_value'),
                    "target_range": lab.get('target_range'),
                    "record_id": lab.get('id'),
                    "sha256_hash": lab.get('sha256_hash'),
                    "blockchain_tx_id": lab.get('blockchain_tx_id'),
                }
            })
        
        # Allergy documents
        allergies = records.get("allergies", [])
        if allergies:
            for i, allergy in enumerate(allergies):
                content = f"Allergy: {allergy}. [Verified in patient record]"
                documents.append({
                    "id": f"allergy_{i}",
                    "patient_code": patient_code,
                    "type": "allergy",
                    "content": content,
                    "metadata": {
                        "allergy": allergy,
                    }
                })
        
        return documents
    
    def build_index(self, patient_code: str, records: Dict[str, Any]):
        """Build FAISS index from patient records"""
        self.documents = self._create_documents_from_records(patient_code, records)
        
        if not self.documents:
            self._initialized = False
            return
        
        # Generate embeddings
        texts = [doc["content"] for doc in self.documents]
        embeddings = self.encoder.encode(texts, normalize_embeddings=True)
        
        # Add to FAISS index
        self.index.reset()
        self.index.add(embeddings.astype('float32'))
        self.document_embeddings = embeddings
        self._initialized = True
    
    def retrieve(self, query: str, k: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant documents for a query"""
        if not self._initialized or not self.documents:
            return []
        
        k = k or self.top_k
        
        # Encode query
        query_embedding = self.encoder.encode([query], normalize_embeddings=True)
        
        # Search
        scores, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Filter by similarity threshold
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents) and score >= self.similarity_threshold:
                doc = self.documents[idx].copy()
                doc["similarity_score"] = float(score)
                results.append(doc)
        
        return results
    
    async def _generate_with_gemini(self, prompt: str, temperature: float = 0.3) -> str:
        """Generate response using Google Gemini"""
        if not self.gemini_model:
            return "LLM not configured. Please set GEMINI_API_KEY."
        
        try:
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=1024,
                )
            )
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def _generate_with_ollama(self, prompt: str, temperature: float = 0.3) -> str:
        """Generate response using local Ollama"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": temperature},
                    },
                )
                response.raise_for_status()
                return response.json().get("response", "No response generated")
        except Exception as e:
            return f"Error with Ollama: {str(e)}"
    
    async def query(
        self,
        patient_code: str,
        query: str,
        records: Dict[str, Any],
        use_llm: bool = True,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """
        Process a medical query through the RAG pipeline.
        """
        # Build index from records
        self.build_index(patient_code, records)
        
        if not self._initialized:
            return {
                "answer": "No patient records available for querying.",
                "sources": [],
                "confidence": 0.0,
                "retrieved_chunks": 0,
            }
        
        # Retrieve relevant documents
        retrieved = self.retrieve(query)
        
        if not retrieved:
            return {
                "answer": "I couldn't find relevant information in the patient's records to answer this question.",
                "sources": [],
                "confidence": 0.0,
                "retrieved_chunks": 0,
            }
        
        # Build context from retrieved documents
        context_parts = []
        sources = []
        
        for i, doc in enumerate(retrieved):
            context_parts.append(f"[{i+1}] {doc['content']}")
            sources.append({
                "type": doc["type"],
                "content_preview": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
                "metadata": doc["metadata"],
                "similarity_score": doc["similarity_score"],
            })
        
        context = "\n\n".join(context_parts)
        
        # Generate answer
        if use_llm:
            prompt = self._build_rag_prompt(query, context)
            
            if self.gemini_model:
                answer = await self._generate_with_gemini(prompt, temperature)
            else:
                answer = await self._generate_with_ollama(prompt, temperature)
        else:
            # Return just the retrieved context
            answer = f"Based on the patient's records:\n\n{context}"
        
        # Calculate confidence based on similarity scores
        avg_similarity = np.mean([d["similarity_score"] for d in retrieved])
        confidence = float(avg_similarity)
        
        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "retrieved_chunks": len(retrieved),
        }
    
    def _build_rag_prompt(self, query: str, context: str) -> str:
        """Build the RAG prompt for the LLM"""
        return f"""You are a clinical AI assistant for AEVORIX, an Electronic Health Record platform with blockchain-verified data integrity.

Your task is to answer the clinician's question using ONLY the provided patient context. The context contains blockchain-verified medical records (each marked with [Blockchain verified: hash...]).

Guidelines:
1. Answer directly and concisely based ONLY on the provided context
2. Cite specific records using [1], [2], etc. corresponding to the context sections
3. If the context doesn't contain enough information, state this clearly
4. Always mention when records are blockchain-verified
5. Flag any potential drug interactions, contraindications, or safety concerns
6. Use clinical terminology appropriately

Patient Context:
{context}

Question: {query}

Answer:"""


# Singleton instance
_rag_pipeline_instance: Optional[RAGPipeline] = None


def get_rag_pipeline(
    embedding_model: str = settings.EMBEDDING_MODEL,
    embedding_dim: int = settings.EMBEDDING_DIM,
    top_k: int = settings.TOP_K_RETRIEVAL,
    similarity_threshold: float = settings.SIMILARITY_THRESHOLD,
    gemini_api_key: str = settings.GEMINI_API_KEY,
    ollama_base_url: str = settings.OLLAMA_BASE_URL,
    ollama_model: str = settings.OLLAMA_MODEL,
) -> RAGPipeline:
    global _rag_pipeline_instance
    if _rag_pipeline_instance is None:
        _rag_pipeline_instance = RAGPipeline(
            embedding_model=embedding_model,
            embedding_dim=embedding_dim,
            top_k=top_k,
            similarity_threshold=similarity_threshold,
            gemini_api_key=gemini_api_key,
            ollama_base_url=ollama_base_url,
            ollama_model=ollama_model,
        )
    return _rag_pipeline_instance