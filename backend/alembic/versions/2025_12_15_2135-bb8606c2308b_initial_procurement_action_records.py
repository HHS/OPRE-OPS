"""initial procurement action records

Revision ID: bb8606c2308b
Revises: 5b89d517ea94
Create Date: 2025-12-15 21:35:06.040366+00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bb8606c2308b"
down_revision: Union[str, None] = "5b89d517ea94"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get database connection
    conn = op.get_bind()

    # Get the system admin user ID, or None if not found
    system_admin_result = conn.execute(
        sa.text("SELECT id FROM ops_user WHERE email = 'system.admin@email.com' LIMIT 1")
    ).fetchone()

    system_admin_id = system_admin_result[0] if system_admin_result else None

    # Get all agreements that have at least one budget line item with status OBLIGATED
    agreements_with_obligated_blis = conn.execute(
        sa.text(
            """
            SELECT DISTINCT a.id, a.name
            FROM agreement a
            INNER JOIN budget_line_item bli ON bli.agreement_id = a.id
            WHERE bli.status = 'OBLIGATED'
        """
        )
    ).fetchall()

    # For each agreement, create a procurement action if one doesn't already exist
    for agreement_id, agreement_name in agreements_with_obligated_blis:
        # Check if this agreement already has a procurement action with NEW_AWARD and AWARDED status
        existing_pa = conn.execute(
            sa.text(
                """
                SELECT id
                FROM procurement_action
                WHERE agreement_id = :agreement_id
                  AND award_type = 'NEW_AWARD'
                  AND status = 'AWARDED'
                LIMIT 1
            """
            ),
            {"agreement_id": agreement_id},
        ).fetchone()

        # If no existing procurement action, create one
        if not existing_pa:
            # Create a new transaction for versioning
            result = conn.execute(sa.text("INSERT INTO transaction (issued_at) VALUES (NOW()) RETURNING id"))
            transaction_id = result.scalar()

            # Insert into main table and get the new ID
            result = conn.execute(
                sa.text(
                    """
                    INSERT INTO procurement_action (
                        agreement_id,
                        award_type,
                        status,
                        action_description,
                        created_by,
                        updated_by
                    ) VALUES (
                        :agreement_id,
                        'NEW_AWARD',
                        'AWARDED',
                        :action_description,
                        :created_by,
                        :updated_by
                    ) RETURNING id
                """
                ),
                {
                    "agreement_id": agreement_id,
                    "action_description": f"Initial award for {agreement_name}",
                    "created_by": system_admin_id,
                    "updated_by": system_admin_id,
                },
            )
            new_pa_id = result.scalar()

            # Insert into version table
            conn.execute(
                sa.text(
                    """
                    INSERT INTO procurement_action_version (
                        id,
                        agreement_id,
                        agreement_mod_id,
                        award_type,
                        mod_type,
                        status,
                        procurement_shop_id,
                        psc_action_number,
                        need_by_date,
                        requisition_deadline,
                        date_awarded_obligated,
                        desired_days_on_street,
                        action_description,
                        comments,
                        psc_fee_percentage,
                        award_total,
                        agreement_total,
                        created_by,
                        updated_by,
                        transaction_id,
                        operation_type
                    ) VALUES (
                        :id,
                        :agreement_id,
                        NULL,
                        'NEW_AWARD',
                        NULL,
                        'AWARDED',
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        :action_description,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        :created_by,
                        :updated_by,
                        :transaction_id,
                        0
                    )
                """
                ),
                {
                    "id": new_pa_id,
                    "agreement_id": agreement_id,
                    "action_description": f"Initial award for {agreement_name}",
                    "transaction_id": transaction_id,
                    "created_by": system_admin_id,
                    "updated_by": system_admin_id,
                },
            )


def downgrade() -> None:
    # Remove procurement actions that were created by this migration
    # We can identify them by the action_description pattern "Initial award for %"
    # and having award_type='NEW_AWARD' and status='AWARDED'
    conn = op.get_bind()

    # First, delete from the version table
    conn.execute(
        sa.text(
            """
            DELETE FROM procurement_action_version
            WHERE award_type = 'NEW_AWARD'
              AND status = 'AWARDED'
              AND action_description LIKE 'Initial award for %'
        """
        )
    )

    # Then delete from the main table
    conn.execute(
        sa.text(
            """
            DELETE FROM procurement_action
            WHERE award_type = 'NEW_AWARD'
              AND status = 'AWARDED'
              AND action_description LIKE 'Initial award for %'
        """
        )
    )
