from flask import current_app

from models import Agreement, Project, User
from ops_api.ops.utils.users import is_super_user


def _collect_agreement_authorized_ids(agreement: Agreement) -> set[int]:
    """Collect user ids authorized via a single agreement and its CAN/portfolio/division chain."""
    ids: set[int] = set()

    if agreement.project_officer_id:
        ids.add(agreement.project_officer_id)
    if agreement.alternate_project_officer_id:
        ids.add(agreement.alternate_project_officer_id)

    ids.update(tm.id for tm in agreement.team_members)

    for bli in agreement.budget_line_items:
        portfolio = bli.can.portfolio if bli.can else None
        if not portfolio:
            continue

        division = portfolio.division
        if division:
            if division.division_director_id:
                ids.add(division.division_director_id)
            if division.deputy_division_director_id:
                ids.add(division.deputy_division_director_id)

        ids.update(leader.id for leader in portfolio.team_leaders)

    return ids


def _collect_project_authorized_ids(project: Project) -> set[int]:
    """Collect the set of user ids authorized for this project via creator/team leaders/agreements."""
    ids: set[int] = set()
    if project.created_by:
        ids.add(project.created_by)
    ids.update(tl.id for tl in project.team_leaders)
    for agreement in project.agreements:
        ids |= _collect_agreement_authorized_ids(agreement)
    return ids


def check_project_user_association(project: Project, user: User) -> bool:
    """
    Check if the user is associated with, and so should be able to modify, the project.

    Authorization is aggregated from across agreements within the project:
    - Project creator
    - Project Team Leaders
    - Division Directors from any CAN/Portfolio on agreements within the project
    - Team Leaders from any CAN/Portfolio on agreements within the project
    - COR or ACOR from any agreement within the project
    - Team Members from any agreement within the project
    - Budget Team members
    - System Owner / Super User
    """
    if not user:
        return False

    if project and user.id in _collect_project_authorized_ids(project):
        return True

    role_names = {role.name for role in user.roles}
    if role_names & {"BUDGET_TEAM", "SYSTEM_OWNER"}:
        return True

    return is_super_user(user, current_app)
