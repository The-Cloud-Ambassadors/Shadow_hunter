"""
Mock Identity Provider (IdP) — Maps internal IPs to employee profiles.

In production, this would integrate with Active Directory, Okta, or Google
Workspace via SCIM/LDAP. For hackathon demo purposes, this provides an
in-memory O(1) lookup dictionary that the capture layer uses to enrich
every packet with human-readable identity data.

Architecture:
    Listener/Simulator → idp_mock.resolve(source_ip) → {user_id, user_name, department}
"""
from typing import Optional, Dict
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class EmployeeProfile:
    """Immutable employee identity record."""
    user_id: str
    user_name: str
    department: str
    role: str
    email: str
    risk_tier: str  # "standard" | "elevated" | "privileged"


# ── Employee Directory ──────────────────────────────────────────────────
# Maps internal IPs to employee profiles.
# In production: populated via SCIM sync from AD/Okta.
_EMPLOYEE_DIRECTORY: Dict[str, EmployeeProfile] = {
    "192.168.1.10": EmployeeProfile(
        user_id="EMP-001",
        user_name="Ravi Sharma",
        department="Engineering",
        role="Senior Developer",
        email="ravi.sharma@company.com",
        risk_tier="standard",
    ),
    "192.168.1.11": EmployeeProfile(
        user_id="EMP-002",
        user_name="Priya Patel",
        department="Design",
        role="UI/UX Designer",
        email="priya.patel@company.com",
        risk_tier="standard",
    ),
    "192.168.1.12": EmployeeProfile(
        user_id="EMP-003",
        user_name="Arjun Mehta",
        department="Management",
        role="Engineering Manager",
        email="arjun.mehta@company.com",
        risk_tier="privileged",
    ),
    "192.168.1.13": EmployeeProfile(
        user_id="EMP-004",
        user_name="Meera Kapoor",
        department="Data Science",
        role="ML Engineer",
        email="meera.kapoor@company.com",
        risk_tier="elevated",
    ),
    "192.168.1.14": EmployeeProfile(
        user_id="EMP-005",
        user_name="Kiran Desai",
        department="Engineering",
        role="Software Intern",
        email="kiran.desai@company.com",
        risk_tier="standard",
    ),
}


# ── Subnet → Department mapping for topology grouping ──────────────────
SUBNET_DEPARTMENTS: Dict[str, str] = {
    "192.168.1.0/26":   "Engineering",      # .1  – .63
    "192.168.1.64/26":  "Design & Product",  # .64 – .127
    "192.168.1.128/26": "Data Science",      # .128– .191
    "192.168.1.192/26": "Management & Ops",  # .192– .255
}

# Internal infrastructure IPs (servers, gateways) — not mapped to people
_INFRA_DIRECTORY: Dict[str, str] = {
    "192.168.1.1":   "Gateway Router",
    "192.168.1.100": "File Server",
    "192.168.1.101": "Git Server",
    "192.168.1.102": "Jira Server",
    "192.168.1.200": "Database Server",
}


def resolve(ip: str) -> Optional[EmployeeProfile]:
    """
    Resolve an internal IP to an employee profile.

    Performance: O(1) dictionary lookup.
    Returns None for unknown IPs (external or unregistered devices).
    """
    return _EMPLOYEE_DIRECTORY.get(ip)


def resolve_infra(ip: str) -> Optional[str]:
    """Resolve an infrastructure IP to its service name."""
    return _INFRA_DIRECTORY.get(ip)


def get_department_for_ip(ip: str) -> Optional[str]:
    """
    Determine department from IP address using subnet mapping.
    Falls back to direct employee lookup if subnet match fails.
    """
    import ipaddress
    try:
        addr = ipaddress.ip_address(ip)
        for cidr, dept in SUBNET_DEPARTMENTS.items():
            if addr in ipaddress.ip_network(cidr, strict=False):
                return dept
    except ValueError:
        pass

    # Fallback: direct employee lookup
    profile = resolve(ip)
    return profile.department if profile else None


def get_all_employees() -> Dict[str, EmployeeProfile]:
    """Return the full employee directory (for admin dashboards)."""
    return dict(_EMPLOYEE_DIRECTORY)


def get_all_departments() -> list:
    """Return unique department names."""
    return list(set(p.department for p in _EMPLOYEE_DIRECTORY.values()))
