import uuid

import pytest
from flask import url_for

from models import ContractAgreement, Project, ProjectType, ResearchProject
from models.projects import ResearchType
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError
from ops_api.ops.services.projects import ProjectsService


def test_project_retrieve(loaded_db, app_ctx):
    project = (
        loaded_db.query(Project).filter(Project.title == "African American Child and Family Research Center").one()
    )

    assert project is not None
    assert project.title == "African American Child and Family Research Center"
    assert project.display_name == project.title
    assert project.url == "https://acf.gov/opre/project/african-american-child-and-family-research-center"


def test_projects_get_all(auth_client, loaded_db):
    count = loaded_db.query(Project).count()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200
    assert len(response.json) == count


def test_projects_get_by_id(auth_client, loaded_db, test_project):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["title"] == "Human Services Interoperability Support"


def test_projects_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-item", id="100000"))
    assert response.status_code == 404


def test_projects_serialization(auth_client, loaded_db, test_user, test_project):
    response = auth_client.get(url_for("api.projects-item", id=test_project.id))
    assert response.status_code == 200
    assert response.json["id"] == test_project.id
    assert response.json["title"] == "Human Services Interoperability Support"
    assert response.json["origination_date"] == "2021-01-01"
    assert response.json["team_leaders"][0]["id"] == test_user.id
    assert response.json["team_leaders"][0]["full_name"] == "Chris Fortunato"


def test_projects_with_fiscal_year_found(auth_client, loaded_db, test_project):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2023))
    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["title"] == "Human Services Interoperability Support"
    assert response.json[0]["id"] == test_project.id


def test_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=2000))
    assert response.status_code == 200
    assert len(response.json) == 0


def test_project_search(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-group", search=""))

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(url_for("api.projects-group", search="fa"))

    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get(url_for("api.projects-group", search="father"))

    assert response.status_code == 200
    assert len(response.json) == 2

    response = auth_client.get(url_for("api.projects-group", search="ExCELS"))

    assert response.status_code == 200
    assert len(response.json) == 1

    response = auth_client.get(url_for("api.projects-group", search="blah"))

    assert response.status_code == 200
    assert len(response.json) == 0


def test_projects_get_by_id_auth(client):
    response = client.get(url_for("api.projects-item", id="1"))
    assert response.status_code == 401


def test_projects_auth(client):
    response = client.get(url_for("api.projects-group"))
    assert response.status_code == 401


def test_post_projects(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "team_leaders": [{"id": 500}, {"id": 501}, {"id": 502}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(Project, id)
    assert project is not None
    assert project.title == "Research Project #1"
    assert len(project.team_leaders) == 3
    assert project.team_leaders[0].id == 500
    assert project.team_leaders[1].id == 501
    assert project.team_leaders[2].id == 502


def test_post_projects_minimum(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201
    id = response.json["id"]
    # verify project was created in db with correct values
    project = loaded_db.get(Project, id)
    assert project is not None
    assert project.title == "Research Project #1"
    assert len(project.team_leaders) == 0


def test_post_projects_empty_post(auth_client, loaded_db):
    response = auth_client.post(url_for("api.projects-group"), json={})
    assert response.status_code == 400


def test_post_projects_bad_team_leaders(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 100000}, {"id": 502}, {"id": 503}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_projects_missing_title(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 502}, {"id": 503}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 400


def test_post_projects_auth_required(client, loaded_db):
    data = {
        "project_type": ProjectType.RESEARCH.name,
        "title": "Research Project #1",
        "short_title": "RP1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "url": "https://example.com",
        "origination_date": "2023-01-01",
        "methodologies": ["SURVEY", "FIELD_RESEARCH", "PARTICIPANT_OBSERVATION"],
        "populations": ["POPULATION_1", "POPULATION_2"],
        "team_leaders": [{"id": 501}, {"id": 502}, {"id": 503}],
    }
    response = client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 401


def test_get_research_types(auth_client, app_ctx):
    response = auth_client.get("/api/v1/research-types/")
    assert response.status_code == 200
    assert response.json == {e.name: e.value for e in ResearchType}


def test_projects_list_uses_lightweight_schema(auth_client, loaded_db, app_ctx):
    """
    Test that the list endpoint returns lightweight schema without expensive nested relationships.
    This verifies the performance optimization that excludes: team_leaders.
    """
    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200
    assert len(response.json) > 0

    project = response.json[0]

    # Verify required fields are present
    assert "id" in project
    assert "title" in project
    assert "short_title" in project
    assert "description" in project
    assert "project_type" in project

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "team_leaders" not in project, "Nested 'team_leaders' should not be in list response (causes N+1 queries)"
    assert "created_by" not in project, "Unused 'created_by' field should not be in list response"


# PATCH/UPDATE tests
def test_patch_project_title(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's title."""
    data = {"title": "Updated Project Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200
    assert response.json["id"] == test_project.id

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert project.title == "Updated Project Title"


def test_patch_project_short_title(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's short title."""
    data = {"short_title": "NEW-SHORT"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert project.short_title == "NEW-SHORT"


def test_patch_project_description(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's description."""
    data = {"description": "This is a new description"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert project.description == "This is a new description"


def test_patch_project_url(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's URL."""
    data = {"url": "https://new-url.example.com"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert project.url == "https://new-url.example.com"


def test_patch_project_origination_date(budget_team_auth_client, loaded_db, test_project):
    """Test updating a research project's origination date."""
    data = {"origination_date": "2024-06-15"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert project.origination_date.strftime("%Y-%m-%d") == "2024-06-15"


def test_patch_project_team_leaders(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's team leaders."""
    data = {"team_leaders": [{"id": 501}, {"id": 502}]}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert len(project.team_leaders) == 2
    assert project.team_leaders[0].id == 501
    assert project.team_leaders[1].id == 502


def test_patch_project_multiple_fields(budget_team_auth_client, loaded_db, test_project):
    """Test updating multiple fields at once."""
    data = {
        "title": "Multi-Update Title",
        "description": "Multi-Update Description",
        "url": "https://multi-update.example.com",
    }
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify all fields were updated
    project = loaded_db.get(Project, test_project.id)
    assert project.title == "Multi-Update Title"
    assert project.description == "Multi-Update Description"
    assert project.url == "https://multi-update.example.com"


def test_patch_project_not_found(budget_team_auth_client, loaded_db):
    """Test patching a non-existent project returns 404."""
    data = {"title": "Updated Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=999999), json=data)
    assert response.status_code == 404


def test_patch_project_invalid_team_leader(budget_team_auth_client, loaded_db, test_project):
    """Test updating with invalid team leader ID returns 400."""
    data = {"team_leaders": [{"id": 999999}]}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 400


def test_patch_project_cannot_change_id(budget_team_auth_client, loaded_db, test_project):
    """Test that ID cannot be changed."""
    data = {"id": 888888, "title": "New Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 400


def test_patch_project_cannot_change_project_type(budget_team_auth_client, loaded_db, test_project):
    """Test that project_type cannot be changed."""
    data = {"project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 400


def test_patch_project_auth_required(client, loaded_db, test_project):
    """Test that PATCH requires authentication."""
    data = {"title": "Updated Title"}
    response = client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 401


def test_patch_project_empty_team_leaders(budget_team_auth_client, loaded_db, test_project):
    """Test updating with empty team leaders list clears team leaders."""
    data = {"team_leaders": []}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify team leaders were cleared
    project = loaded_db.get(Project, test_project.id)
    assert len(project.team_leaders) == 0


def test_patch_project_partial_update(budget_team_auth_client, loaded_db, test_project):
    """Test partial update doesn't affect other fields."""
    original_title = test_project.title
    original_description = test_project.description

    data = {"url": "https://partial-update.example.com"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify only URL was updated, other fields unchanged
    project = loaded_db.get(Project, test_project.id)
    assert project.url == "https://partial-update.example.com"
    assert project.title == original_title
    assert project.description == original_description


# ProjectsService.delete() tests
@pytest.fixture
def projects_service(loaded_db):
    """Create a ProjectsService instance with the loaded database session."""
    return ProjectsService(loaded_db)


@pytest.fixture
def project_with_no_agreements(loaded_db):
    """Create a test project with no agreements."""
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Test Project With No Agreements",
        short_title="TPNA",
        description="A test project that has no associated agreements",
    )
    loaded_db.add(project)
    loaded_db.commit()
    loaded_db.refresh(project)
    return project


def test_delete_project_successfully(projects_service, loaded_db, project_with_no_agreements):
    """Test successfully deleting a project with no agreements."""
    project_id = project_with_no_agreements.id

    # Verify project exists before deletion
    assert loaded_db.get(Project, project_id) is not None

    # Delete the project
    projects_service.delete(project_id)

    # Verify project is deleted
    assert loaded_db.get(Project, project_id) is None


def test_delete_project_with_agreements_raises_validation_error(projects_service, loaded_db, test_project):
    """Test that deleting a project with associated agreements raises ValidationError."""
    project_id = test_project.id

    # Verify project has agreements
    project = loaded_db.get(Project, project_id)
    assert project is not None
    assert len(project.agreements) > 0, "Test project must have associated agreements"

    # Attempt to delete should raise ValidationError
    with pytest.raises(ValidationError) as exc_info:
        projects_service.delete(project_id)

    # Verify error message
    assert "agreements" in exc_info.value.validation_errors
    assert "Cannot delete a project that has associated agreements" in str(
        exc_info.value.validation_errors["agreements"]
    )

    # Verify project still exists
    assert loaded_db.get(Project, project_id) is not None


def test_delete_non_existent_project_raises_resource_not_found(projects_service, loaded_db):
    """Test that deleting a non-existent project raises ResourceNotFoundError."""
    non_existent_id = 999999

    # Verify project doesn't exist
    assert loaded_db.get(Project, non_existent_id) is None

    # Attempt to delete should raise ResourceNotFoundError
    with pytest.raises(ResourceNotFoundError) as exc_info:
        projects_service.delete(non_existent_id)

    # Verify error details
    assert exc_info.value.resource_type == "Project"
    assert exc_info.value.resource_id == non_existent_id
    assert "Project with id 999999 not found" in str(exc_info.value)


def test_delete_project_removes_from_database(projects_service, loaded_db, project_with_no_agreements):
    """Test that delete actually removes the project from the database."""
    project_id = project_with_no_agreements.id

    # Count projects before deletion
    count_before = loaded_db.query(Project).count()

    # Delete the project
    projects_service.delete(project_id)

    # Count projects after deletion
    count_after = loaded_db.query(Project).count()

    # Verify count decreased by one
    assert count_after == count_before - 1


def test_delete_project_with_single_agreement(projects_service, loaded_db, project_with_no_agreements):
    """Test that a project with even one agreement cannot be deleted."""
    project_id = project_with_no_agreements.id

    # Add a single agreement to the project
    agreement = ContractAgreement(
        name="Test Agreement",
        project_id=project_id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Verify project now has one agreement
    project = loaded_db.get(Project, project_id)
    assert len(project.agreements) == 1

    # Attempt to delete should raise ValidationError
    with pytest.raises(ValidationError) as exc_info:
        projects_service.delete(project_id)

    # Verify error message
    assert "agreements" in exc_info.value.validation_errors
    assert "Cannot delete a project that has associated agreements" in str(
        exc_info.value.validation_errors["agreements"]
    )

    # Verify project still exists
    assert loaded_db.get(Project, project_id) is not None
