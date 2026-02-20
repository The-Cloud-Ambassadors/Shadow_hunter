import hashlib
import random
from typing import Dict, Optional

class GeoIPService:
    """
    Provides GeoIP data for visualization.
    
    For Hackathon purposes, this uses consistent hashing to map IPs to
    plausible locations if a real MaxMind DB is not found.
    """
    
    def __init__(self):
        # Top AI/Cloud locations
        self.locs = [
            {"country": "US", "city": "Ashburn", "lat": 39.0438, "lon": -77.4874}, # AWS East
            {"country": "US", "city": "San Francisco", "lat": 37.7749, "lon": -122.4194}, # OpenAI
            {"country": "IE", "city": "Dublin", "lat": 53.3498, "lon": -6.2603}, # EU West
            {"country": "CN", "city": "Beijing", "lat": 39.9042, "lon": 116.4074}, # China
            {"country": "RU", "city": "Moscow", "lat": 55.7558, "lon": 37.6173}, # Russia
            {"country": "DE", "city": "Frankfurt", "lat": 50.1109, "lon": 8.6821},
            {"country": "SG", "city": "Singapore", "lat": 1.3521, "lon": 103.8198},
            {"country": "BR", "city": "Sao Paulo", "lat": -23.5505, "lon": -46.6333},
        ]

    def lookup(self, ip: str) -> Optional[Dict]:
        """
        Get location data for an IP.
        """
        if ip == "127.0.0.1" or ip.startswith("192.168") or ip.startswith("10."):
            return None # Internal
            
        # Hash IP to get consistent index
        hash_val = int(hashlib.md5(ip.encode()).hexdigest(), 16)
        
        # Determine if we want a "threat" location or standard
        # Use first byte to pick region roughly?
        idx = hash_val % len(self.locs)
        base = self.locs[idx]
        
        # Add slight jitter so not all stack exactly
        jitter_lat = (hash_val % 100) / 1000.0
        jitter_lon = ((hash_val >> 8) % 100) / 1000.0
        
        return {
            "country": base["country"],
            "city": base["city"],
            "lat": base["lat"] + jitter_lat,
            "lon": base["lon"] + jitter_lon,
            "iso_code": base["country"]
        }
