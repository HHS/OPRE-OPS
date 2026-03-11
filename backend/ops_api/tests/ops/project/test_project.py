import uuid
from datetime import date

import pytest
from flask import url_for

from models import AgreementType, ContractAgreement, Project, ProjectType, ResearchProject
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
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json
    assert response.json["count"] == count
    assert len(response.json["data"]) == min(count, 10)  # Default limit is 10


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
    response = auth_client.get(url_for("api.projects-group", fiscal_year=[2023]))
    assert response.status_code == 200
    assert response.json["count"] == 5
    assert len(response.json["data"]) == 5
    assert response.json["data"][0]["title"] == "Human Services Interoperability Support"
    assert response.json["data"][0]["id"] == test_project.id


def test_projects_with_fiscal_year_not_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.projects-group", fiscal_year=[2000]))
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_project_search(auth_client, loaded_db):
    # Empty string returns no results
    response = auth_client.get(url_for("api.projects-group", project_search=[""]))

    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0

    # Search by exact short_title "RFH" (Responsible Fatherhood project)
    response = auth_client.get(url_for("api.projects-group", project_search=["RFH"]))

    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1

    # Search by multiple exact short_titles - "RFH" and "FCL" (Fathers and Continuous Learning)
    response = auth_client.get(url_for("api.projects-group", project_search=["RFH", "FCL"]))

    assert response.status_code == 200
    assert response.json["count"] == 2
    assert len(response.json["data"]) == 2

    # Search by exact short_title "ECE" (Early Care and Education Leadership Study)
    response = auth_client.get(url_for("api.projects-group", project_search=["ECE"]))

    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1

    # Search with non-existent title returns no results
    response = auth_client.get(url_for("api.projects-group", project_search=["blah"]))

    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_agreement_search(auth_client, loaded_db, test_project):
    """Test filtering projects by associated agreement names (exact match)."""
    # Create test agreements associated with test_project
    agreement1 = ContractAgreement(
        name="Research Agreement for Testing 2023",
        project_id=test_project.id,
    )
    agreement2 = ContractAgreement(
        name="Support Services Agreement",
        project_id=test_project.id,
    )
    loaded_db.add(agreement1)
    loaded_db.add(agreement2)
    loaded_db.commit()

    # Search for exact agreement name - should find test_project
    response = auth_client.get(url_for("api.projects-group", agreement_search=["Research Agreement for Testing 2023"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search for exact agreement name - should find test_project
    response = auth_client.get(url_for("api.projects-group", agreement_search=["Support Services Agreement"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search for multiple exact agreement names - should find test_project
    response = auth_client.get(
        url_for(
            "api.projects-group",
            agreement_search=["Research Agreement for Testing 2023", "Support Services Agreement"],
        )
    )
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search for non-existent agreement name - should return no projects or projects without this agreement
    response = auth_client.get(url_for("api.projects-group", agreement_search=["NonExistentAgreement"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id not in project_ids

    # Empty search should return no results
    response = auth_client.get(url_for("api.projects-group", agreement_search=[""]))
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_agreement_search_multiple_projects(auth_client, loaded_db):
    """Test agreement search returns all projects with matching agreements (exact match)."""
    # Create two research projects
    project1 = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Project Alpha",
        short_title="PA",
        description="First test project",
    )
    project2 = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Project Beta",
        short_title="PB",
        description="Second test project",
    )
    loaded_db.add(project1)
    loaded_db.add(project2)
    loaded_db.commit()

    # Create agreements for both projects
    agreement1 = ContractAgreement(
        name="Special Contract Alpha",
        project_id=project1.id,
    )
    agreement2 = ContractAgreement(
        name="Special Contract Beta",
        project_id=project2.id,
    )
    loaded_db.add(agreement1)
    loaded_db.add(agreement2)
    loaded_db.commit()

    # Search for exact agreement name - should find both projects
    response = auth_client.get(
        url_for("api.projects-group", agreement_search=["Special Contract Alpha", "Special Contract Beta"])
    )
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert project1.id in project_ids
    assert project2.id in project_ids

    # Search for exact agreement name - should find only project1
    response = auth_client.get(url_for("api.projects-group", agreement_search=["Special Contract Alpha"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert project1.id in project_ids
    assert project2.id not in project_ids


def test_combined_project_and_agreement_search(auth_client, loaded_db, test_project):
    """Test combining project_search and agreement_search filters (both use exact match)."""
    # Create an agreement for test_project
    agreement = ContractAgreement(
        name="Integration Test Agreement",
        project_id=test_project.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Search with both exact project short_title and exact agreement name (AND logic)
    # test_project has title "Human Services Interoperability Support" and short_title "HSS"
    # Should find test_project (short_title exactly matches "HSS" AND has agreement exactly matching "Integration Test Agreement")
    response = auth_client.get(
        url_for("api.projects-group", project_search=["HSS"], agreement_search=["Integration Test Agreement"])
    )
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search with exact project short_title that matches but agreement name that doesn't
    # Should NOT find test_project
    response = auth_client.get(url_for("api.projects-group", project_search=["HSS"], agreement_search=["NonExistent"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id not in project_ids


def test_agreement_search_by_nick_name(auth_client, loaded_db, test_project):
    """Test filtering projects by agreement nick_name in addition to agreement name (exact match)."""
    # Create agreements with nick_names
    agreement1 = ContractAgreement(
        name="Complex Long Agreement Name 2024",
        nick_name="CLAN-2024",
        project_id=test_project.id,
    )
    agreement2 = ContractAgreement(
        name="Another Agreement",
        nick_name="SPECIAL-NICKNAME",
        project_id=test_project.id,
    )
    loaded_db.add(agreement1)
    loaded_db.add(agreement2)
    loaded_db.commit()

    # Search by exact nick_name - should find test_project
    response = auth_client.get(url_for("api.projects-group", agreement_search=["CLAN-2024"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search by exact nick_name - should find test_project
    response = auth_client.get(url_for("api.projects-group", agreement_search=["SPECIAL-NICKNAME"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search by exact agreement name - should find test_project
    response = auth_client.get(url_for("api.projects-group", agreement_search=["Complex Long Agreement Name 2024"]))
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids

    # Search with multiple exact terms - should find test_project if ANY agreement matches ANY term
    # agreement1.name exactly matches "Complex Long Agreement Name 2024"
    # agreement2.nick_name exactly matches "SPECIAL-NICKNAME"
    response = auth_client.get(
        url_for("api.projects-group", agreement_search=["Complex Long Agreement Name 2024", "SPECIAL-NICKNAME"])
    )
    assert response.status_code == 200
    project_ids = [p["id"] for p in response.json["data"]]
    assert test_project.id in project_ids


def test_project_type_filter_all_vs_none(auth_client, loaded_db):
    """Test that no project_type filter returns same results as all types specified."""
    # Get all projects without type filter
    response_no_filter = auth_client.get(url_for("api.projects-group"))
    assert response_no_filter.status_code == 200

    # Get all projects with both types explicitly specified
    response_all_types = auth_client.get(
        url_for(
            "api.projects-group",
            project_type=[ProjectType.RESEARCH.name, ProjectType.ADMINISTRATIVE_AND_SUPPORT.name],
        )
    )
    assert response_all_types.status_code == 200

    # Both should return the same number of projects
    assert len(response_no_filter.json) == len(response_all_types.json)

    # Both should contain the same project IDs (order might differ)
    ids_no_filter = sorted([p["id"] for p in response_no_filter.json["data"]])
    ids_all_types = sorted([p["id"] for p in response_all_types.json["data"]])
    assert ids_no_filter == ids_all_types


def test_project_type_filter_single_type(auth_client, loaded_db):
    """Test filtering by a single project type."""
    # Get only research projects
    response_research = auth_client.get(
        url_for("api.projects-group", project_type=[ProjectType.RESEARCH.name], limit=50)
    )
    assert response_research.status_code == 200
    research_projects = [p for p in response_research.json["data"] if p["project_type"] == ProjectType.RESEARCH.name]
    assert len(research_projects) == len(response_research.json["data"]), "Should only return research projects"

    # Get only admin/support projects
    response_admin = auth_client.get(
        url_for("api.projects-group", project_type=[ProjectType.ADMINISTRATIVE_AND_SUPPORT.name], limit=50)
    )
    assert response_admin.status_code == 200
    admin_projects = [
        p for p in response_admin.json["data"] if p["project_type"] == ProjectType.ADMINISTRATIVE_AND_SUPPORT.name
    ]
    assert len(admin_projects) == len(response_admin.json["data"]), "Should only return admin/support projects"

    # Sum of both types should equal total projects
    response_all = auth_client.get(url_for("api.projects-group", limit=50))
    assert response_all.status_code == 200
    assert len(response_research.json["data"]) + len(response_admin.json["data"]) == len(response_all.json["data"])


def test_projects_get_by_id_auth(client):
    response = client.get(url_for("api.projects-item", id="1"))
    assert response.status_code == 401


def test_projects_auth(client):
    response = client.get(url_for("api.projects-group"))
    assert response.status_code == 401


def test_post_projects(auth_client, loaded_db):
    team_leader_ids = [500, 501, 502]
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
    assert project.team_leaders[0].id in team_leader_ids
    assert project.team_leaders[1].id in team_leader_ids
    assert project.team_leaders[2].id in team_leader_ids


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
    response = auth_client.get("/api/v1/lookups/research-types/")
    assert response.status_code == 200
    assert response.json == {e.name: e.value for e in ResearchType}


def test_projects_list_uses_lightweight_schema(auth_client, loaded_db, app_ctx):
    """
    Test that the list endpoint returns lightweight schema without expensive nested relationships.
    This verifies the performance optimization that excludes: team_leaders.
    """
    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200
    assert "data" in response.json
    assert len(response.json["data"]) > 0

    project = response.json["data"][0]

    # Verify required fields are present
    assert "id" in project
    assert "title" in project
    assert "short_title" in project
    assert "description" in project
    assert "project_type" in project
    assert "created_on" in project
    assert "updated_on" in project

    # Verify project metadata fields from project_list_metadata are present
    assert "start_date" in project
    assert "end_date" in project
    assert "fiscal_year_totals" in project
    assert "project_total" in project

    # Verify fiscal_year_totals is a dict (or None)
    assert project["fiscal_year_totals"] is None or isinstance(project["fiscal_year_totals"], dict)

    # Verify project_total is an int (or None)
    assert project["project_total"] is None or isinstance(project["project_total"], int)

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "team_leaders" not in project, "Nested 'team_leaders' should not be in list response (causes N+1 queries)"
    assert "created_by" not in project, "Unused 'created_by' field should not be in list response"


def test_project_list_metadata_serialization(auth_client, loaded_db, test_project):
    """
    Test that project_list_metadata is correctly extracted and serialized in list response.
    """
    from decimal import Decimal

    from models import BudgetLineItem, ServicesComponent

    # Add a services component with date range to the test project's agreement
    agreement = test_project.agreements[0]
    sc = ServicesComponent(
        agreement_id=agreement.id,
        period_start=date.fromisoformat("2023-01-01"),
        period_end=date.fromisoformat("2023-12-31"),
        number=10,
    )
    loaded_db.add(sc)

    # Add budget line items with fiscal years to test fiscal_year_totals
    # Set status to PLANNED so they're included in totals (DRAFT items are excluded)
    from models.budget_line_items import BudgetLineItemStatus

    bli1 = BudgetLineItem(
        budget_line_item_type=AgreementType.CONTRACT,
        agreement_id=agreement.id,
        amount=Decimal("1000.00"),
        date_needed=date.fromisoformat("2023-03-15"),  # FY 2023
        status=BudgetLineItemStatus.PLANNED,
    )
    bli2 = BudgetLineItem(
        budget_line_item_type=AgreementType.CONTRACT,
        agreement_id=agreement.id,
        amount=Decimal("2000.00"),
        date_needed=date.fromisoformat("2024-03-15"),  # FY 2024
        status=BudgetLineItemStatus.PLANNED,
    )
    loaded_db.add(bli1)
    loaded_db.add(bli2)
    loaded_db.commit()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200

    # Find the test project in the response
    project_data = next((p for p in response.json["data"] if p["id"] == test_project.id), None)
    assert project_data is not None

    # Verify metadata fields are populated
    assert project_data["start_date"] == "2023-01-01"
    assert project_data["end_date"] == "2045-06-13"
    assert project_data["project_total"] is not None
    assert isinstance(project_data["project_total"], int)

    # Verify fiscal_year_totals contains the expected fiscal years
    assert project_data["fiscal_year_totals"] is not None
    assert isinstance(project_data["fiscal_year_totals"], dict)
    # Fiscal year totals should have entries for FY 2023 and 2024
    assert "2023" in project_data["fiscal_year_totals"] or "2024" in project_data["fiscal_year_totals"].keys()


# PATCH/UPDATE tests
def test_patch_project_title(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating a project's title."""
    data = {"title": "Updated Project Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200
    assert response.json["id"] == project_with_no_agreements.id

    # Verify project was updated in db
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.title == "Updated Project Title"


def test_patch_project_short_title(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating a project's short title."""
    data = {"short_title": "NEW-SHORT"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.short_title == "NEW-SHORT"


def test_patch_project_description(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating a project's description."""
    data = {"description": "This is a new description"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.description == "This is a new description"


def test_patch_project_url(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating a project's URL."""
    data = {"url": "https://new-url.example.com"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.url == "https://new-url.example.com"


def test_patch_project_origination_date(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating a research project's origination date."""
    data = {"origination_date": "2024-06-15"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.origination_date.strftime("%Y-%m-%d") == "2024-06-15"


def test_patch_project_team_leaders(budget_team_auth_client, loaded_db, test_project):
    """Test updating a project's team leaders."""
    leader_ids = [501, 502]
    data = {"team_leaders": [{"id": 501}, {"id": 502}]}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=test_project.id), json=data)
    assert response.status_code == 200

    # Verify project was updated in db
    project = loaded_db.get(Project, test_project.id)
    assert len(project.team_leaders) == 2
    assert project.team_leaders[0].id in leader_ids
    assert project.team_leaders[1].id in leader_ids


def test_patch_project_multiple_fields(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating multiple fields at once."""
    data = {
        "title": "Multi-Update Title",
        "description": "Multi-Update Description",
        "url": "https://multi-update.example.com",
    }
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify all fields were updated
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert project.title == "Multi-Update Title"
    assert project.description == "Multi-Update Description"
    assert project.url == "https://multi-update.example.com"


def test_patch_project_not_found(budget_team_auth_client, loaded_db):
    """Test patching a non-existent project returns 404."""
    data = {"title": "Updated Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=999999), json=data)
    assert response.status_code == 404


def test_patch_project_invalid_team_leader(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating with invalid team leader ID returns 400."""
    data = {"team_leaders": [{"id": 999999}]}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 400


def test_patch_project_cannot_change_id(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test that ID cannot be changed."""
    data = {"id": 888888, "title": "New Title"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 400


def test_patch_project_cannot_change_project_type(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test that project_type cannot be changed."""
    data = {"project_type": ProjectType.ADMINISTRATIVE_AND_SUPPORT.name}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 400


def test_patch_project_auth_required(client, loaded_db, project_with_no_agreements):
    """Test that PATCH requires authentication."""
    data = {"title": "Updated Title"}
    response = client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 401


def test_patch_project_empty_team_leaders(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test updating with empty team leaders list clears team leaders."""
    data = {"team_leaders": []}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify team leaders were cleared
    project = loaded_db.get(Project, project_with_no_agreements.id)
    assert len(project.team_leaders) == 0


def test_patch_project_partial_update(budget_team_auth_client, loaded_db, project_with_no_agreements):
    """Test partial update doesn't affect other fields."""
    original_title = project_with_no_agreements.title
    original_description = project_with_no_agreements.description

    data = {"url": "https://partial-update.example.com"}
    response = budget_team_auth_client.patch(url_for("api.projects-item", id=project_with_no_agreements.id), json=data)
    assert response.status_code == 200

    # Verify only URL was updated, other fields unchanged
    project = loaded_db.get(Project, project_with_no_agreements.id)
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


class TestProjectFilterOptions:

    def test_get_project_filter_options(self, auth_client, app_ctx):
        """GET /projects-filters/ returns all expected filter option fields."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        data = response.json
        assert "fiscal_years" in data
        assert "portfolios" in data
        assert "project_titles" in data
        assert "project_types" in data
        assert "agreement_names" in data

    def test_filter_options_fiscal_years_sorted_descending(self, auth_client, app_ctx):
        """Fiscal years should be sorted in descending order."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        fiscal_years = response.json["fiscal_years"]
        assert len(fiscal_years) > 0
        assert fiscal_years == sorted(fiscal_years, reverse=True)

    def test_filter_options_portfolios_have_id_and_name(self, auth_client, app_ctx):
        """Portfolios should be returned as list of dicts with id and name."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200
        portfolios = response.json["portfolios"]
        assert len(portfolios) > 0
        for portfolio in portfolios:
            assert "id" in portfolio
            assert "name" in portfolio

    def test_filter_options_portfolios_sorted_by_name(self, auth_client, app_ctx):
        """Portfolios should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        portfolios = response.json["portfolios"]
        names = [p["name"] for p in portfolios]
        assert names == sorted(names)

    def test_filter_options_project_titles_have_id_and_name(self, auth_client, app_ctx):
        """Project titles should be returned as list of dicts with id and name."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        project_titles = response.json["project_titles"]
        assert len(project_titles) > 0
        for project in project_titles:
            assert "id" in project
            assert "name" in project

    def test_filter_options_project_titles_sorted_by_name(self, auth_client, app_ctx):
        """Project titles should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        project_titles = response.json["project_titles"]
        names = [p["name"] for p in project_titles]
        assert names == sorted(names)

    def test_filter_options_agreement_types_sorted(self, auth_client, app_ctx):
        """Agreement types should be sorted alphabetically."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        project_types = response.json["project_types"]
        assert len(project_types) > 0
        assert project_types == sorted(project_types)

    def test_filter_options_agreement_names_sorted_by_name(self, auth_client, app_ctx):
        """Agreement names should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.projects-filters"))
        assert response.status_code == 200

        agreement_names = response.json["agreement_names"]
        names = [a for a in agreement_names]
        assert names == sorted(names)
