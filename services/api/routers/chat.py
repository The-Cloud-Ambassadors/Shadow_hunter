from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter(tags=["llm"])

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    action: str = None
    filter_params: dict = None

@router.post("/query", response_model=ChatResponse)
async def chat_query(req: ChatRequest):
    """
    Simulated LLM Query Parser.
    Translates natural language to system actions.
    """
    q = req.query.lower()
    
    # 1. High Risk / Critical Logic
    if "high risk" in q or "critical" in q:
        return ChatResponse(
            answer="I found several **High Risk** nodes exceeding the safety threshold. I've filtered the network view for you.",
            action="FILTER_NODES",
            filter_params={"type": "shadow", "min_risk": 80}
        )
        
    # 2. Shadow AI / ChatGPT
    if "shadow ai" in q or "chatgpt" in q or "openai" in q:
        return ChatResponse(
            answer="Detecting **Shadow AI** usage. I'm taking you to the Network Graph to visualize the sources.",
            action="NAVIGATE",
            filter_params={"tab": "network"}
        )
        
    # 3. Explain / Why
    if "why" in q or "explain" in q:
        return ChatResponse(
            answer="The AI Engine uses **Isolation Forest** and **JA3 Fingerprinting**. This alert was triggered because the packet size entropy (4.2 bits) matched known exfiltration patterns.",
            action="SHOW_INFO"
        )
        
    # Default / Hallucination fallback
    return ChatResponse(
        answer="I'm analyzing the network graph... Could you specify if you want to see **Alerts**, **Shadow Nodes**, or **Risk Scores**?",
        action="NONE"
    )
