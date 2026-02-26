"""
Corporate Assets Configuration — Defines what counts as "company traffic".

Used by Privacy Mode to ensure only work-related traffic is monitored.
Remote workers' personal browsing (banking, social media, streaming)
is explicitly excluded when PRIVACY_MODE is active.

Architecture:
    Listener.capture() → corporate_assets.is_corporate_traffic(dst_ip) → bool
    If False and PRIVACY_MODE == True → packet is dropped silently.
"""
import ipaddress
import os
from typing import Set

# ── Configuration ───────────────────────────────────────────────────────
PRIVACY_MODE = os.environ.get("SH_PRIVACY_MODE", "true").lower() == "true"

# ── Corporate CIDR Blocks (internal subnets monitored by default) ──────
CORPORATE_CIDRS = [
    ipaddress.ip_network("192.168.1.0/24"),    # Office LAN
    ipaddress.ip_network("10.0.0.0/8"),        # AWS VPC / Corporate WAN
    ipaddress.ip_network("172.16.0.0/12"),      # Additional private ranges
]

# ── Corporate SaaS Domains / IPs (always monitored) ────────────────────
# These are company-sanctioned services whose traffic is ALWAYS tracked,
# even in Privacy Mode, because they handle corporate data.
CORPORATE_SAAS_DOMAINS: Set[str] = {
    "slack.com",
    "notion.so",
    "github.com",
    "gitlab.com",
    "jira.atlassian.com",
    "confluence.atlassian.com",
    "docs.google.com",
    "drive.google.com",
    "mail.google.com",
    "calendar.google.com",
    "zoom.us",
    "teams.microsoft.com",
    "office365.com",
}

# ── Explicitly IGNORED domains (personal traffic — never monitored) ───
PERSONAL_DOMAINS: Set[str] = {
    "netflix.com",
    "youtube.com",
    "spotify.com",
    "instagram.com",
    "facebook.com",
    "twitter.com",
    "tiktok.com",
    "reddit.com",
    "amazon.com",
    "ebay.com",
    "bankofamerica.com",
    "chase.com",
    "paypal.com",
    "venmo.com",
}


def is_corporate_traffic(dst_ip: str, metadata: dict = None) -> bool:
    """
    Determine if a destination IP/domain represents corporate traffic.

    Logic:
        1. All internal (RFC1918) IPs are corporate.
        2. If metadata contains a known corporate SaaS domain, it's corporate.
        3. If metadata contains a known personal domain, it's NOT corporate.
        4. Unknown external IPs default to corporate (monitored) for safety.

    Performance: O(k) where k = number of CIDR blocks (small constant).
    """
    try:
        addr = ipaddress.ip_address(dst_ip)

        # Internal traffic is always corporate
        if addr.is_private:
            return True

    except ValueError:
        pass

    # Check metadata for domain hints
    if metadata:
        host = metadata.get("host", "") or metadata.get("sni", "")
        host_lower = host.lower()

        # Explicitly personal → not corporate
        if any(personal in host_lower for personal in PERSONAL_DOMAINS):
            return False

        # Explicitly corporate SaaS → corporate
        if any(corp in host_lower for corp in CORPORATE_SAAS_DOMAINS):
            return True

    # Default: monitor unknown external traffic (safe default)
    return True


def should_capture(dst_ip: str, metadata: dict = None) -> bool:
    """
    Master filter: should the listener capture this packet?

    If PRIVACY_MODE is OFF → capture everything.
    If PRIVACY_MODE is ON  → only capture corporate traffic.
    """
    if not PRIVACY_MODE:
        return True
    return is_corporate_traffic(dst_ip, metadata)
