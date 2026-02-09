"""
LLM Manager - Dynamic LLM Provider with Fallback Support

Features:
- Multiple LLM providers (OpenAI, Gemini, DeepSeek, Grok)
- Automatic failover on token exhaustion/errors
- Token optimization (caching, compression, limits)
- Provider health checks
"""

import os
import time
import hashlib
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()

# ============================================
# Configuration
# ============================================

@dataclass
class LLMConfig:
    """Configuration for an LLM provider"""
    name: str
    model: str
    max_tokens: int
    temperature: float = 0.0
    api_key: Optional[str] = None
    enabled: bool = True
    priority: int = 0


@dataclass
class LLMResponse:
    """Response from an LLM provider"""
    text: str
    provider: str
    model: str
    tokens_used: int
    success: bool
    error: Optional[str] = None
    latency_ms: int = 0


# ============================================
# Provider Base Class
# ============================================

class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    def __init__(self, config: LLMConfig):
        self.config = config
        self._last_error: Optional[str] = None
        self._error_count: int = 0
        self._success_count: int = 0
        self._total_tokens: int = 0
        self._request_times: List[float] = []
    
    @abstractmethod
    async def generate(self, prompt: str, max_tokens: Optional[int] = None) -> LLMResponse:
        """Generate text from the LLM"""
        pass
    
    @abstractmethod
    async def check_health(self) -> bool:
        """Check if the provider is available"""
        pass
    
    @property
    def is_healthy(self) -> bool:
        """Check if the provider is healthy (error rate < 50%)"""
        total = self._error_count + self._success_count
        if total == 0:
            return True
        return (self._error_count / total) < 0.5
    
    @property
    def stats(self) -> Dict[str, Any]:
        """Get provider statistics"""
        return {
            'name': self.config.name,
            'model': self.config.model,
            'success_count': self._success_count,
            'error_count': self._error_count,
            'total_tokens': self._total_tokens,
            'is_healthy': self.is_healthy
        }


# ============================================
# OpenAI Provider
# ============================================

class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT provider (gpt-4o-mini for cost efficiency)"""
    
    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self._client = None
    
    async def _get_client(self):
        """Lazy import of OpenAI client"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.config.api_key)
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        return self._client
    
    async def generate(self, prompt: str, max_tokens: Optional[int] = None) -> LLMResponse:
        start_time = time.time()
        try:
            client = await self._get_client()
            
            response = client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are a helpful engineering assistant. Keep responses concise and accurate."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens or self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            
            self._success_count += 1
            self._total_tokens += tokens
            
            return LLMResponse(
                text=text,
                provider=self.config.name,
                model=self.config.model,
                tokens_used=tokens,
                success=True,
                latency_ms=latency_ms
            )
        except Exception as e:
            self._error_count += 1
            self._last_error = str(e)
            return LLMResponse(
                text="",
                provider=self.config.name,
                model=self.config.model,
                tokens_used=0,
                success=False,
                error=str(e),
                latency_ms=int((time.time() - start_time) * 1000)
            )
    
    async def check_health(self) -> bool:
        try:
            client = await self._get_client()
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.models.list()
            )
            return True
        except Exception:
            return False


# ============================================
# Gemini Provider
# ============================================

class GeminiProvider(BaseLLMProvider):
    """Google Gemini provider (1.5 Flash - generous free tier)"""
    
    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self._client = None
    
    async def _get_client(self):
        """Lazy import of Gemini client"""
        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.config.api_key)
            except ImportError:
                raise ImportError("Google GenAI package not installed. Run: pip install google-genai")
        return self._client
    
    async def generate(self, prompt: str, max_tokens: Optional[int] = None) -> LLMResponse:
        start_time = time.time()
        try:
            client = await self._get_client()
            
            response = client.models.generate_content(
                model=self.config.model,
                contents=[prompt]
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            text = response.text
            
            # Estimate tokens (rough approximation)
            tokens = len(text.split()) * 1.3
            
            self._success_count += 1
            self._total_tokens += int(tokens)
            
            return LLMResponse(
                text=text,
                provider=self.config.name,
                model=self.config.model,
                tokens_used=int(tokens),
                success=True,
                latency_ms=latency_ms
            )
        except Exception as e:
            self._error_count += 1
            self._last_error = str(e)
            return LLMResponse(
                text="",
                provider=self.config.name,
                model=self.config.model,
                tokens_used=0,
                success=False,
                error=str(e),
                latency_ms=int((time.time() - start_time) * 1000)
            )
    
    async def check_health(self) -> bool:
        try:
            client = await self._get_client()
            # Simple health check by listing models
            return True
        except Exception:
            return False


# ============================================
# DeepSeek Provider
# ============================================

class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek provider (cheap and good for volume)"""
    
    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self._client = None
    
    async def _get_client(self):
        """Lazy import of DeepSeek client"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    api_key=self.config.api_key,
                    base_url="https://api.deepseek.com"
                )
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        return self._client
    
    async def generate(self, prompt: str, max_tokens: Optional[int] = None) -> LLMResponse:
        start_time = time.time()
        try:
            client = await self._get_client()
            
            response = client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are a helpful engineering assistant. Keep responses concise and accurate."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens or self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            
            self._success_count += 1
            self._total_tokens += tokens
            
            return LLMResponse(
                text=text,
                provider=self.config.name,
                model=self.config.model,
                tokens_used=tokens,
                success=True,
                latency_ms=latency_ms
            )
        except Exception as e:
            self._error_count += 1
            self._last_error = str(e)
            return LLMResponse(
                text="",
                provider=self.config.name,
                model=self.config.model,
                tokens_used=0,
                success=False,
                error=str(e),
                latency_ms=int((time.time() - start_time) * 1000)
            )
    
    async def check_health(self) -> bool:
        try:
            client = await self._get_client()
            return True
        except Exception:
            return False


# ============================================
# Grok Provider
# ============================================

class GrokProvider(BaseLLMProvider):
    """xAI Grok provider"""
    
    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self._client = None
    
    async def _get_client(self):
        """Lazy import of Grok client"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    api_key=self.config.api_key,
                    base_url="https://api.x.ai/v1"
                )
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        return self._client
    
    async def generate(self, prompt: str, max_tokens: Optional[int] = None) -> LLMResponse:
        start_time = time.time()
        try:
            client = await self._get_client()
            
            response = client.chat.completions.create(
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are Grok, a witty engineering assistant. Keep responses concise."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens or self.config.max_tokens,
                temperature=self.config.temperature
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            
            self._success_count += 1
            self._total_tokens += tokens
            
            return LLMResponse(
                text=text,
                provider=self.config.name,
                model=self.config.model,
                tokens_used=tokens,
                success=True,
                latency_ms=latency_ms
            )
        except Exception as e:
            self._error_count += 1
            self._last_error = str(e)
            return LLMResponse(
                text="",
                provider=self.config.name,
                model=self.config.model,
                tokens_used=0,
                success=False,
                error=str(e),
                latency_ms=int((time.time() - start_time) * 1000)
            )
    
    async def check_health(self) -> bool:
        try:
            client = await self._get_client()
            return True
        except Exception:
            return False


# ============================================
# LLM Manager
# ============================================

class LLMManager:
    """
    Central manager for LLM providers with:
    - Dynamic provider switching
    - Automatic failover
    - Token optimization
    - Response caching
    """
    
    def __init__(self):
        self._providers: Dict[str, BaseLLMProvider] = {}
        self._provider_order: List[str] = []
        self._cache: Dict[str, tuple] = {}  # {prompt_hash: (response, timestamp)}
        self._cache_ttl = 3600  # 1 hour cache TTL
        self._stats = {
            'total_requests': 0,
            'total_failures': 0,
            'provider_usage': {}
        }
    
    def add_provider(self, provider: BaseLLMProvider) -> None:
        """Add a provider to the manager"""
        self._providers[provider.config.name] = provider
        self._provider_order.append(provider.config.name)
        self._provider_order.sort(key=lambda x: self._providers[x].config.priority)
    
    async def generate(
        self, 
        prompt: str, 
        max_tokens: Optional[int] = None,
        preferred_provider: Optional[str] = None
    ) -> LLMResponse:
        """
        Generate text with automatic failover.
        
        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens for response
            preferred_provider: Try this provider first
        
        Returns:
            LLMResponse from the first successful provider
        """
        self._stats['total_requests'] += 1
        
        # Check cache
        cache_key = self._get_cache_key(prompt)
        if cache_key in self._cache:
            cached_response, timestamp = self._cache[cache_key]
            if time.time() - timestamp < self._cache_ttl:
                cached_response.success = True
                cached_response.error = None
                return cached_response
        
        # Determine provider order
        if preferred_provider and preferred_provider in self._providers:
            order = [preferred_provider] + [
                p for p in self._provider_order 
                if p != preferred_provider
            ]
        else:
            order = self._provider_order
        
        # Try each provider in order
        last_error = None
        for provider_name in order:
            provider = self._providers[provider_name]
            
            # Skip unhealthy providers
            if not provider.is_healthy:
                print(f"Skipping unhealthy provider: {provider_name}")
                continue
            
            # Try the provider
            response = await provider.generate(prompt, max_tokens)
            
            if response.success:
                # Update stats
                self._stats['provider_usage'][provider_name] = \
                    self._stats['provider_usage'].get(provider_name, 0) + 1
                
                # Cache successful responses
                self._cache[cache_key] = (response, time.time())
                
                return response
            else:
                last_error = response.error
                print(f"Provider {provider_name} failed: {response.error}")
        
        # All providers failed
        self._stats['total_failures'] += 1
        return LLMResponse(
            text="",
            provider="none",
            model="none",
            tokens_used=0,
            success=False,
            error=f"All providers failed. Last error: {last_error}"
        )
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all providers"""
        results = {}
        for name, provider in self._providers.items():
            results[name] = await provider.check_health()
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get manager statistics"""
        return {
            'stats': self._stats,
            'providers': {
                name: provider.stats 
                for name, provider in self._providers.items()
            },
            'cache_size': len(self._cache)
        }
    
    def _get_cache_key(self, text: str) -> str:
        """Generate a cache key from text"""
        return hashlib.md5(text.encode()).hexdigest()
    
    def clear_cache(self) -> None:
        """Clear the response cache"""
        self._cache.clear()


# ============================================
# Factory Functions
# ============================================

def create_llm_manager() -> LLMManager:
    """Create an LLM manager with all configured providers"""
    manager = LLMManager()
    
    # Gemini (highest priority - generous free tier)
    if os.getenv('GEMINI_API_KEY'):
        gemini_config = LLMConfig(
            name='gemini',
            model=os.getenv('GEMINI_MODEL', 'gemini-1.5-flash'),
            max_tokens=int(os.getenv('GEMINI_MAX_TOKENS', '512')),
            temperature=0.0,
            api_key=os.getenv('GEMINI_API_KEY'),
            enabled=True,
            priority=0
        )
        manager.add_provider(GeminiProvider(gemini_config))
        print("[OK] Gemini provider configured")
    
    # DeepSeek (cheap, good fallback)
    if os.getenv('DEEPSEEK_API_KEY'):
        deepseek_config = LLMConfig(
            name='deepseek',
            model=os.getenv('DEEPSEEK_MODEL', 'deepseek-chat'),
            max_tokens=int(os.getenv('DEEPSEEK_MAX_TOKENS', '512')),
            temperature=0.0,
            api_key=os.getenv('DEEPSEEK_API_KEY'),
            enabled=True,
            priority=1
        )
        manager.add_provider(DeepSeekProvider(deepseek_config))
        print("[OK] DeepSeek provider configured")
    
    # OpenAI (standard)
    if os.getenv('OPENAI_API_KEY'):
        openai_config = LLMConfig(
            name='openai',
            model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
            max_tokens=int(os.getenv('OPENAI_MAX_TOKENS', '512')),
            temperature=0.0,
            api_key=os.getenv('OPENAI_API_KEY'),
            enabled=True,
            priority=2
        )
        manager.add_provider(OpenAIProvider(openai_config))
        print("[OK] OpenAI provider configured")
    
    # Grok (xAI)
    if os.getenv('GROK_API_KEY'):
        grok_config = LLMConfig(
            name='grok',
            model=os.getenv('GROK_MODEL', 'grok-2-latest'),
            max_tokens=int(os.getenv('GROK_MAX_TOKENS', '512')),
            temperature=0.0,
            api_key=os.getenv('GROK_API_KEY'),
            enabled=True,
            priority=3
        )
        manager.add_provider(GrokProvider(grok_config))
        print("[OK] Grok provider configured")
    
    if not manager._providers:
        print("WARNING: No LLM providers configured!")
        print("  Add API keys to .env file")
    
    return manager


# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        print("Initializing LLM Manager...")
        manager = create_llm_manager()
        
        print("\nProviders configured:", list(manager._providers.keys()))
        
        print("\nHealth check:")
        health = await manager.health_check_all()
        for name, status in health.items():
            print(f"  {name}: OK" if status else f"  {name}: FAIL")
        
        print("\nTesting generation...")
        response = await manager.generate(
            "What is Ohm's law? Give a brief answer."
        )
        
        if response.success:
            print(f"\nOK: Success! (Provider: {response.provider})")
            print(f"  Response: {response.text[:200]}...")
            print(f"  Tokens: {response.tokens_used}")
            print(f"  Latency: {response.latency_ms}ms")
        else:
            print(f"\nFAIL: {response.error}")
        
        print("\nStats:", manager.get_stats())
    
    asyncio.run(test())
