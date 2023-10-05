from dataclasses import dataclass
from typing import Optional


@dataclass
class TeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
