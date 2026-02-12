# Comprehensive List of GenAI and ML Service Domains
# Organized by Category for Clarity

AI_DOMAINS = {
    # --- Major LLM Providers ---
    "openai.com", "api.openai.com", "chatgpt.com", "oaistatic.com", "oaiusercontent.com",
    "anthropic.com", "claude.ai", "api.anthropic.com",
    "huggingface.co", "hf.co", "api-inference.huggingface.co",
    "cohere.ai", "api.cohere.ai",
    "mistral.ai", "api.mistral.ai", "console.mistral.ai",
    "ai21.com", "studio.ai21.com",
    "perplexity.ai", "pplx.ai",
    
    # --- Google AI ---
    "gemini.google.com", "bard.google.com", "generativelanguage.googleapis.com",
    "ai.google.dev", "vertexai.google.com", "notebooklm.google.com",
    
    # --- Microsoft / GitHub Copilot ---
    "githubcopilot.com", "copilot-proxy.githubusercontent.com", "copilot.microsoft.com",
    "bing.com/chat", "designer.microsoft.com",
    
    # --- Image & Video Generation ---
    "midjourney.com", "discord.com", # Often accessed via Discord
    "stability.ai", "stable-diffusion.com", "clipdrop.co",
    "runwayml.com", "app.runwayml.com",
    "leonardo.ai", "app.leonardo.ai",
    "canva.com", # Has huge AI integration now
    "pika.art", "sora.com",
    
    # --- Code Assistants ---
    "tabnine.com", "api.tabnine.com",
    "codeium.com",
    "sourcelink.ai", "mutable.ai",
    "cursor.sh", "cursor.com",
    
    # --- Audio & Speech ---
    "elevenlabs.io", "api.elevenlabs.io",
    "suno.ai", "app.suno.ai",
    "udio.com",
    "speechify.com",
    "murf.ai",
    
    # --- Agent Platforms & Tools ---
    "langchain.com", "smith.langchain.com",
    "crewai.com",
    "autogen.microsoft.com",
    "zapier.com", # High risk for automated AI workflows
    
    # --- Other / Shadow Infrastructure ---
    "replicate.com", "api.replicate.com",
    "modal.com", # Serverless GPU often used for custom models
    "together.xyz", "api.together.xyz",
    "fireworks.ai",
    "groq.com", "api.groq.com",
    "deepseeks.com", "chat.deepseek.com"
}

def is_ai_domain(domain: str) -> bool:
    """
    Check if a domain or its parent is a known AI service.
    Handles exact matches and subdomains (e.g., 'cdn.openai.com' -> 'openai.com').
    """
    if not domain:
        return False
    
    domain = domain.lower().strip()
    
    # 1. Exact Match
    if domain in AI_DOMAINS:
        return True
    
    # 2. Parent Domain Match (Robust Suffix Check)
    parts = domain.split('.')
    # Check parent (openai.com) and grandparent (api.openai.com - unlikely to need deeper)
    if len(parts) >= 2:
        parent = ".".join(parts[-2:]) # openai.com
        if parent in AI_DOMAINS:
            return True
            
    if len(parts) >= 3:
        grandparent = ".".join(parts[-3:]) # api.openai.com
        if grandparent in AI_DOMAINS:
            return True
            
    return False
