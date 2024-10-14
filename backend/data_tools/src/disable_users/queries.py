EXCLUDED_USER_IDS = [520, 521, 522, 523, 525, 526]

SYSTEM_USER_ID = 526
SYSTEM_USER_OIDC_ID = "00000000-0000-1111-a111-000000000026"
SYSTEM_USER_EMAIL = "system.admin@email.com"

INACTIVE_USER_QUERY = (
    "SELECT id "
    "FROM ops_user "
    "WHERE id IN ( "
    "    SELECT ou.id "
    "    FROM user_session JOIN ops_user ou ON user_session.user_id = ou.id "
    "    WHERE ou.status = 'ACTIVE' "
    "    AND user_session.last_active_at < CURRENT_TIMESTAMP - INTERVAL '60 days'"
    ");"
)

ALL_ACTIVE_USER_SESSIONS_QUERY = (
    "SELECT * "
    "FROM user_session "
    "WHERE user_id = :user_id AND is_active = TRUE "
    "ORDER BY created_on DESC"
)

SYSTEM_USER_QUERY = "SELECT id FROM ops_user WHERE oidc_id = :oidc_id"
