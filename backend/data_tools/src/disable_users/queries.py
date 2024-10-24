from data_tools.src.common.utils import SYSTEM_ADMIN_OIDC_ID
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import UserSession

EXCLUDED_USER_OIDC_IDS = [
    "00000000-0000-1111-a111-000000000018",     # Admin Demo
    "00000000-0000-1111-a111-000000000019",     # User Demo
    "00000000-0000-1111-a111-000000000020",     # Director Dave
    "00000000-0000-1111-a111-000000000021",     # Budget Team
    "00000000-0000-1111-a111-000000000022",     # Director Derrek
    SYSTEM_ADMIN_OIDC_ID                         # System Admin
]

ALL_ACTIVE_USER_SESSIONS_QUERY = (
    "SELECT * "
    "FROM user_session "
    "WHERE user_id = :user_id AND is_active = TRUE "
    "ORDER BY created_on DESC"
)

GET_USER_ID_BY_OIDC_QUERY = "SELECT id FROM ops_user WHERE oidc_id = :oidc_id"

def get_latest_user_session(user_id: int, session: Session) -> UserSession | None:
    return (
        session.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)  # type: ignore
            .order_by(UserSession.created_on.desc())
        )
        .scalars()
        .first()
    )
