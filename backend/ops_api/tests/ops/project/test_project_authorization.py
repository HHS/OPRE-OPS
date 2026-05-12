import uuid

import pytest
from flask import current_app, url_for

from models import (
    CAN,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    Portfolio,
    Project,
    ProjectType,
    ResearchProject,
    User,
)
from ops_api.ops.utils.projects_helpers import check_project_user_association


@pytest.fixture
def unassociated_project(loaded_db):
    """Create a project with no associations to any test auth client user."""
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Unassociated Auth Test Project",
        short_title="UATP" + uuid.uuid4().hex[:6],
        description="Project with no user associations for authorization testing",
    )
    loaded_db.add(project)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


@pytest.fixture
def project_created_by_basic_user(loaded_db):
    """Create a project where created_by = basic_user_auth_client (user 521)."""
    prev = current_app.config.get("SKIP_SETTING_CREATED_BY", False)
    current_app.config["SKIP_SETTING_CREATED_BY"] = True
    try:
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Basic User Created Project",
            short_title="BUCP" + uuid.uuid4().hex[:6],
            description="Project created by user 521",
            created_by=521,
        )
        loaded_db.add(project)
        loaded_db.commit()
        loaded_db.refresh(project)
    finally:
        current_app.config["SKIP_SETTING_CREATED_BY"] = prev
    return project


@pytest.fixture
def project_with_basic_user_team_leader(loaded_db):
    """Create a project where user 521 is a project team leader."""
    user_521 = loaded_db.get(User, 521)
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Project TL Auth Test Project",
        short_title="PTLA" + uuid.uuid4().hex[:6],
        description="Project for project team leader auth testing",
        team_leaders=[user_521],
    )
    loaded_db.add(project)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


@pytest.fixture
def project_with_agreement_team_member(loaded_db):
    """Create a project with an agreement that has user 521 as a team member."""
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Team Member Auth Test Project",
        short_title="TMAT" + uuid.uuid4().hex[:6],
        description="Project for team member auth testing",
    )
    loaded_db.add(project)
    loaded_db.flush()

    user_521 = loaded_db.get(User, 521)

    agreement = ContractAgreement(
        name="Auth Test Agreement " + uuid.uuid4().hex[:6],
        project_id=project.id,
        team_members=[user_521],
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


@pytest.fixture
def project_with_agreement_project_officer(loaded_db):
    """Create a project with an agreement where user 521 is the project officer (COR)."""
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Project Officer Auth Test Project",
        short_title="POAT" + uuid.uuid4().hex[:6],
        description="Project for COR auth testing",
    )
    loaded_db.add(project)
    loaded_db.flush()

    agreement = ContractAgreement(
        name="COR Auth Test Agreement " + uuid.uuid4().hex[:6],
        project_id=project.id,
        project_officer_id=521,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


@pytest.fixture
def project_with_agreement_alternate_officer(loaded_db):
    """Create a project with an agreement where user 521 is the ACOR."""
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="ACOR Auth Test Project",
        short_title="ACAT" + uuid.uuid4().hex[:6],
        description="Project for ACOR auth testing",
    )
    loaded_db.add(project)
    loaded_db.flush()

    agreement = ContractAgreement(
        name="ACOR Auth Test Agreement " + uuid.uuid4().hex[:6],
        project_id=project.id,
        alternate_project_officer_id=521,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


class TestCheckProjectUserAssociation:
    """Unit tests for check_project_user_association helper."""

    def test_project_creator_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        prev = current_app.config.get("SKIP_SETTING_CREATED_BY", False)
        current_app.config["SKIP_SETTING_CREATED_BY"] = True
        try:
            project = ResearchProject(
                project_type=ProjectType.RESEARCH,
                title="Creator Test",
                short_title="CT" + uuid.uuid4().hex[:6],
                created_by=521,
            )
            loaded_db.add(project)
            loaded_db.commit()
            loaded_db.refresh(project)
        finally:
            current_app.config["SKIP_SETTING_CREATED_BY"] = prev

        assert project.created_by == 521
        assert check_project_user_association(project, user) is True

    def test_project_officer_from_agreement_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="COR Test",
            short_title="CORT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="COR Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
            project_officer_id=521,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_alternate_project_officer_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="ACOR Test",
            short_title="ACORT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="ACOR Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
            alternate_project_officer_id=521,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_team_member_from_agreement_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="TM Test",
            short_title="TMT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="TM Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
            team_members=[user],
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_division_director_is_authorized(self, app_ctx, loaded_db):
        from sqlalchemy import text

        user = loaded_db.get(User, 522)  # Division Director

        # Use division 4 which has portfolios with CANs in test data
        loaded_db.execute(text("UPDATE division SET division_director_id = :uid WHERE id = 4"), {"uid": 522})
        loaded_db.commit()

        portfolio = loaded_db.query(Portfolio).filter(Portfolio.division_id == 4).first()
        assert portfolio is not None

        can = loaded_db.query(CAN).filter(CAN.portfolio_id == portfolio.id).first()
        assert can is not None

        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="DD Test",
            short_title="DDT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="DD Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            can_id=can.id,
            amount=100,
            status=BudgetLineItemStatus.DRAFT,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_budget_team_role_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 523)  # Budget team
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="BT Test",
            short_title="BTT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_system_owner_role_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 503)  # System owner (auth_client)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="SO Test",
            short_title="SOT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_super_user_role_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 528)  # Power user with SUPER_USER role
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Super User Test",
            short_title="SUT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_project_team_leader_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Project TL Test",
            short_title="PTL" + uuid.uuid4().hex[:6],
            team_leaders=[user],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True

    def test_portfolio_team_leader_is_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)

        portfolio = loaded_db.query(Portfolio).filter(Portfolio.division_id == 4).first()
        assert portfolio is not None
        portfolio.team_leaders.append(user)
        loaded_db.commit()

        can = loaded_db.query(CAN).filter(CAN.portfolio_id == portfolio.id).first()
        assert can is not None

        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="TL Test",
            short_title="TLT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="TL Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            can_id=can.id,
            amount=100,
            status=BudgetLineItemStatus.DRAFT,
        )
        loaded_db.add(bli)
        loaded_db.commit()

        try:
            assert check_project_user_association(project, user) is True
        finally:
            portfolio.team_leaders.remove(user)
            loaded_db.commit()

    def test_project_with_no_agreements_and_unassociated_user_returns_false(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="No Agreements Test",
            short_title="NAT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        # created_by stays None because we never went through the audit stamp
        assert project.created_by is None
        assert project.agreements == []
        assert check_project_user_association(project, user) is False

    def test_none_user_returns_false(self, app_ctx, loaded_db):
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="None User Test",
            short_title="NUT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, None) is False

    def test_unassociated_user_is_not_authorized(self, app_ctx, loaded_db):
        user = loaded_db.get(User, 521)  # Basic user
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Unassociated Test",
            short_title="UT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.commit()

        assert check_project_user_association(project, user) is False

    def test_aggregation_across_multiple_agreements(self, app_ctx, loaded_db):
        """User is team member on one agreement but not another; still authorized for the project."""
        user = loaded_db.get(User, 521)
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Multi Agreement Test",
            short_title="MAT" + uuid.uuid4().hex[:6],
        )
        loaded_db.add(project)
        loaded_db.flush()

        # Agreement where user is NOT associated
        agreement1 = ContractAgreement(
            name="Other Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
        )
        loaded_db.add(agreement1)

        # Agreement where user IS a team member
        agreement2 = ContractAgreement(
            name="User Agreement " + uuid.uuid4().hex[:6],
            project_id=project.id,
            team_members=[user],
        )
        loaded_db.add(agreement2)
        loaded_db.commit()

        assert check_project_user_association(project, user) is True


class TestPatchProjectAuthorization:
    """Integration tests for project PATCH endpoint authorization."""

    def test_patch_project_unauthorized_user_returns_403(self, basic_user_auth_client, loaded_db, unassociated_project):
        """User with PATCH_RESEARCH_PROJECT permission but no project association gets 403."""
        data = {"title": "Should Not Update"}
        response = basic_user_auth_client.patch(url_for("api.projects-item", id=unassociated_project.id), json=data)
        assert response.status_code == 403

    def test_patch_project_creator_can_edit(self, basic_user_auth_client, loaded_db, project_created_by_basic_user):
        """User who created the project can edit it."""
        data = {"title": "Updated By Creator"}
        response = basic_user_auth_client.patch(
            url_for("api.projects-item", id=project_created_by_basic_user.id), json=data
        )
        assert response.status_code == 200

        project = loaded_db.get(Project, project_created_by_basic_user.id)
        assert project.title == "Updated By Creator"

    def test_patch_project_team_leader_can_edit(
        self, basic_user_auth_client, loaded_db, project_with_basic_user_team_leader
    ):
        """User who is a project team leader can edit the project."""
        data = {"title": "Updated By Project Team Leader"}
        response = basic_user_auth_client.patch(
            url_for("api.projects-item", id=project_with_basic_user_team_leader.id), json=data
        )
        assert response.status_code == 200

        project = loaded_db.get(Project, project_with_basic_user_team_leader.id)
        assert project.title == "Updated By Project Team Leader"

    def test_patch_project_team_member_can_edit(
        self, basic_user_auth_client, loaded_db, project_with_agreement_team_member
    ):
        """User who is a team member on an agreement within the project can edit."""
        data = {"title": "Updated By Team Member"}
        response = basic_user_auth_client.patch(
            url_for("api.projects-item", id=project_with_agreement_team_member.id), json=data
        )
        assert response.status_code == 200

        project = loaded_db.get(Project, project_with_agreement_team_member.id)
        assert project.title == "Updated By Team Member"

    def test_patch_project_cor_can_edit(
        self, basic_user_auth_client, loaded_db, project_with_agreement_project_officer
    ):
        """User who is COR on an agreement within the project can edit."""
        data = {"title": "Updated By COR"}
        response = basic_user_auth_client.patch(
            url_for("api.projects-item", id=project_with_agreement_project_officer.id), json=data
        )
        assert response.status_code == 200

    def test_patch_project_acor_can_edit(
        self, basic_user_auth_client, loaded_db, project_with_agreement_alternate_officer
    ):
        """User who is ACOR on an agreement within the project can edit."""
        data = {"title": "Updated By ACOR"}
        response = basic_user_auth_client.patch(
            url_for("api.projects-item", id=project_with_agreement_alternate_officer.id), json=data
        )
        assert response.status_code == 200

    def test_patch_project_budget_team_always_can_edit(self, budget_team_auth_client, loaded_db, unassociated_project):
        """Budget team user can edit any project regardless of association."""
        data = {"title": "Updated By Budget Team"}
        response = budget_team_auth_client.patch(url_for("api.projects-item", id=unassociated_project.id), json=data)
        assert response.status_code == 200

    def test_patch_project_no_perms_returns_403(self, no_perms_auth_client, loaded_db, unassociated_project):
        """User with no permissions gets 403 at decorator level."""
        data = {"title": "Should Not Update"}
        response = no_perms_auth_client.patch(url_for("api.projects-item", id=unassociated_project.id), json=data)
        assert response.status_code == 403


class TestGetProjectMetaIsEditable:
    """GET /projects/<id> returns _meta.isEditable matching the backend authorization rules."""

    def test_get_project_unassociated_user_is_not_editable(
        self, basic_user_auth_client, loaded_db, unassociated_project
    ):
        response = basic_user_auth_client.get(url_for("api.projects-item", id=unassociated_project.id))
        assert response.status_code == 200
        assert response.json["_meta"]["isEditable"] is False

    def test_get_project_creator_is_editable(self, basic_user_auth_client, loaded_db, project_created_by_basic_user):
        response = basic_user_auth_client.get(url_for("api.projects-item", id=project_created_by_basic_user.id))
        assert response.status_code == 200
        assert response.json["_meta"]["isEditable"] is True

    def test_get_project_team_leader_is_editable(
        self, basic_user_auth_client, loaded_db, project_with_basic_user_team_leader
    ):
        response = basic_user_auth_client.get(url_for("api.projects-item", id=project_with_basic_user_team_leader.id))
        assert response.status_code == 200
        assert response.json["_meta"]["isEditable"] is True

    def test_get_project_budget_team_is_editable(self, budget_team_auth_client, loaded_db, unassociated_project):
        response = budget_team_auth_client.get(url_for("api.projects-item", id=unassociated_project.id))
        assert response.status_code == 200
        assert response.json["_meta"]["isEditable"] is True
