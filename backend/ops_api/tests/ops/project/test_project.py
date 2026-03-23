import uuid
from datetime import date
from decimal import Decimal

import pytest
from flask import url_for

from models import (
    CAN,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    Project,
    ProjectType,
    ResearchProject,
    ServicesComponent,
)
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
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["title"] == "Support Project #1"


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

    # Verify project_total is an str (or None) to preserve precision (since it can be a large decimal), and is not a float which could lose precision
    assert project["project_total"] is None or isinstance(project["project_total"], str)

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "team_leaders" not in project, "Nested 'team_leaders' should not be in list response (causes N+1 queries)"
    assert "created_by" not in project, "Unused 'created_by' field should not be in list response"


def test_project_list_metadata_serialization(auth_client, loaded_db):
    """
    Test that project_list_metadata is correctly extracted and serialized in list response.
    """
    # Create a new project
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Project List Metadata Test Project",
        short_title="PLMTP",
        description="Test project for list metadata serialization",
    )
    loaded_db.add(project)
    loaded_db.commit()
    loaded_db.refresh(project)

    # Create an agreement for the project
    agreement = ContractAgreement(
        name="Test Agreement for Metadata",
        project_id=project.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Add a services component with date range
    sc = ServicesComponent(
        agreement_id=agreement.id,
        period_start=date.fromisoformat("2023-01-01"),
        period_end=date.fromisoformat("2023-12-31"),
        number=10,
    )
    loaded_db.add(sc)

    # Add budget line items with fiscal years to test fiscal_year_totals
    # Set status to PLANNED so they're included in totals (DRAFT items are excluded)
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

    response = auth_client.get(url_for("api.projects-group", limit=50))
    assert response.status_code == 200

    # Find the project in the response
    project_data = next((p for p in response.json["data"] if p["id"] == project.id), None)
    assert project_data is not None

    # Verify metadata fields are populated
    assert project_data["start_date"] == "2023-01-01"
    assert project_data["end_date"] == "2023-12-31"
    assert project_data["project_total"] is not None
    assert isinstance(project_data["project_total"], str)

    # Verify fiscal_year_totals contains the expected fiscal years
    assert project_data["fiscal_year_totals"] is not None
    assert isinstance(project_data["fiscal_year_totals"], dict)
    # Fiscal year totals should have entries for FY 2023 and 2024
    assert "2023" in project_data["fiscal_year_totals"] and "2024" in project_data["fiscal_year_totals"].keys()


def test_project_list_metadata_agreement_name_list_property(loaded_db, test_project):
    """
    Test that the project_list_metadata property returns agreement_name_list correctly.
    """
    # Directly test the property on the model
    metadata = test_project.project_list_metadata
    assert "agreement_name_list" in metadata
    assert isinstance(metadata["agreement_name_list"], list)
    if len(test_project.agreements) > 0:
        assert len(metadata["agreement_name_list"]) > 0
        # Check that each entry has id and name
        for item in metadata["agreement_name_list"]:
            assert "id" in item
            assert "name" in item


def test_agreement_name_list_prefers_nick_name_over_title(auth_client, loaded_db, test_project):
    """
    Test that agreement_name_list prefers nick_name over title when nick_name is available.
    """
    # Get the test project's first agreement and set a nick_name
    agreement = test_project.agreements[0]
    agreement.nick_name = "HSS-2023"
    loaded_db.commit()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200

    # Find the test project in the response
    project_data = next((p for p in response.json["data"] if p["id"] == test_project.id), None)
    assert project_data is not None

    # Verify agreement_name_list is present
    assert "agreement_name_list" in project_data
    assert project_data["agreement_name_list"] is not None
    assert isinstance(project_data["agreement_name_list"], list)
    assert len(project_data["agreement_name_list"]) > 0

    # Find the agreement in the list
    agreement_entry = next((a for a in project_data["agreement_name_list"] if a["id"] == agreement.id), None)
    assert agreement_entry is not None

    # Verify nick_name is used instead of title
    assert agreement_entry["name"] == "HSS-2023"
    assert agreement_entry["name"] != agreement.name  # Should not be the name since nick_name is available


def test_agreement_name_list_uses_title_when_no_nick_name(auth_client, loaded_db, test_project):
    """
    Test that agreement_name_list uses title when nick_name is not available.
    """
    # Ensure the test project's first agreement has no nick_name
    agreement = test_project.agreements[0]
    agreement.nick_name = None
    loaded_db.commit()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200

    # Find the test project in the response
    project_data = next((p for p in response.json["data"] if p["id"] == test_project.id), None)
    assert project_data is not None

    # Verify agreement_name_list is present
    assert "agreement_name_list" in project_data
    assert project_data["agreement_name_list"] is not None
    assert isinstance(project_data["agreement_name_list"], list)
    assert len(project_data["agreement_name_list"]) > 0

    # Find the agreement in the list
    agreement_entry = next((a for a in project_data["agreement_name_list"] if a["id"] == agreement.id), None)
    assert agreement_entry is not None

    # Verify name is used when nick_name is None
    assert agreement_entry["name"] == agreement.name


def test_agreement_name_list_always_includes_id(auth_client, loaded_db, test_project):
    """
    Test that every entry in agreement_name_list always has an agreement id.
    """
    # Add multiple agreements to the test project
    agreement1 = ContractAgreement(
        name="First Agreement",
        nick_name="FA-2023",
        project_id=test_project.id,
    )
    agreement2 = ContractAgreement(
        name="Second Agreement",
        nick_name=None,  # No nick_name
        project_id=test_project.id,
    )
    agreement3 = ContractAgreement(
        name="Third Agreement",
        nick_name="TA-2024",
        project_id=test_project.id,
    )
    loaded_db.add(agreement1)
    loaded_db.add(agreement2)
    loaded_db.add(agreement3)
    loaded_db.commit()

    response = auth_client.get(url_for("api.projects-group"))
    assert response.status_code == 200

    # Find the test project in the response
    project_data = next((p for p in response.json["data"] if p["id"] == test_project.id), None)
    assert project_data is not None

    # Verify agreement_name_list is present
    assert "agreement_name_list" in project_data
    assert project_data["agreement_name_list"] is not None
    assert isinstance(project_data["agreement_name_list"], list)

    # Verify all entries have both 'id' and 'name' keys
    for agreement_entry in project_data["agreement_name_list"]:
        assert "id" in agreement_entry, "Every agreement entry must have an 'id' key"
        assert "name" in agreement_entry, "Every agreement entry must have a 'name' key"
        assert isinstance(agreement_entry["id"], int), "Agreement id must be an integer"
        assert isinstance(agreement_entry["name"], str), "Agreement name must be a string"
        assert agreement_entry["id"] > 0, "Agreement id must be positive"
        assert len(agreement_entry["name"]) > 0, "Agreement name must not be empty"

    # Verify specific agreements are in the list with correct names
    agreement_ids = [a["id"] for a in project_data["agreement_name_list"]]
    assert agreement1.id in agreement_ids
    assert agreement2.id in agreement_ids
    assert agreement3.id in agreement_ids

    # Verify names match expected values (nick_name preferred)
    agreement1_entry = next((a for a in project_data["agreement_name_list"] if a["id"] == agreement1.id), None)
    assert agreement1_entry["name"] == "FA-2023"  # Uses nick_name

    agreement2_entry = next((a for a in project_data["agreement_name_list"] if a["id"] == agreement2.id), None)
    assert agreement2_entry["name"] == "Second Agreement"  # Uses title (no nick_name)

    agreement3_entry = next((a for a in project_data["agreement_name_list"] if a["id"] == agreement3.id), None)
    assert agreement3_entry["name"] == "TA-2024"  # Uses nick_name


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


class TestProjectSorting:
    """Tests for project sorting functionality."""

    def test_sort_by_title(self, auth_client, loaded_db):
        """Test sorting projects by title in ascending and descending order."""
        # Sort ascending
        response = auth_client.get(url_for("api.projects-group", sort_field="TITLE", sort_descending=False, limit=50))
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending (case-insensitive)
        titles = [p["title"].lower() for p in projects[:3]]
        assert titles == sorted(titles)

        # Sort descending
        response = auth_client.get(url_for("api.projects-group", sort_field="TITLE", sort_descending=True, limit=50))
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending (case-insensitive)
        titles = [p["title"].lower() for p in projects[:3]]
        assert titles == sorted(titles, reverse=True)

    def test_sort_by_project_type(self, auth_client, loaded_db):
        """Test sorting projects by project type in ascending and descending order."""
        # Sort ascending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_TYPE", sort_descending=False, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending
        types = [p["project_type"] for p in projects[:3]]
        assert types == sorted(types, reverse=True)

        # Sort descending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_TYPE", sort_descending=True, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending
        types = [p["project_type"] for p in projects[:3]]
        assert types == sorted(types, reverse=False)

    def test_sort_by_project_start(self, auth_client, loaded_db, test_project):
        """Test sorting projects by start date in ascending and descending order."""
        # Add services components with start dates to test_project
        agreement = test_project.agreements[0]
        sc1 = ServicesComponent(
            agreement_id=agreement.id,
            period_start=date.fromisoformat("2023-01-01"),
            period_end=date.fromisoformat("2023-12-31"),
            number=11,
        )
        loaded_db.add(sc1)
        loaded_db.commit()

        # Sort ascending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_START", sort_descending=False, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending (None values should be last)
        dates = [p["start_date"] for p in projects[:3]]
        # Filter out None values for comparison
        non_none_dates = [d for d in dates if d is not None]
        assert non_none_dates == sorted(non_none_dates)

        # Sort descending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_START", sort_descending=True, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending
        dates = [p["start_date"] for p in projects[:3]]
        non_none_dates = [d for d in dates if d is not None]
        assert non_none_dates == sorted(non_none_dates, reverse=True)

    def test_sort_by_project_end(self, auth_client, loaded_db, test_project):
        """Test sorting projects by end date in ascending and descending order."""
        # Add services components with end dates to test_project
        agreement = test_project.agreements[0]
        sc1 = ServicesComponent(
            agreement_id=agreement.id,
            period_start=date.fromisoformat("2023-01-01"),
            period_end=date.fromisoformat("2023-12-31"),
            number=20,
        )
        loaded_db.add(sc1)
        loaded_db.commit()

        # Sort ascending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_END", sort_descending=False, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending (None values should be last)
        dates = [p["end_date"] for p in projects[:3]]
        non_none_dates = [d for d in dates if d is not None]
        assert non_none_dates == sorted(non_none_dates)

        # Sort descending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_END", sort_descending=True, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending
        dates = [p["end_date"] for p in projects[:3]]
        non_none_dates = [d for d in dates if d is not None]
        assert non_none_dates == sorted(non_none_dates, reverse=True)

    def test_sort_by_fy_total(self, auth_client, loaded_db, test_project):
        """Test sorting projects by fiscal year total in ascending and descending order."""
        # Add BLIs to test_project for FY 2023
        agreement = test_project.agreements[0]
        bli1 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("5000.00"),
            date_needed=date.fromisoformat("2023-03-15"),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli1)
        loaded_db.commit()

        # Sort ascending by FY 2023
        response = auth_client.get(
            url_for("api.projects-group", sort_field="FY_TOTAL", sort_fiscal_year=2023, sort_descending=False, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending
        fy_totals = [
            Decimal(p["fiscal_year_totals"].get("2023", 0)) if p["fiscal_year_totals"] else 0 for p in projects[:3]
        ]
        assert fy_totals == sorted(fy_totals)

        # Sort descending by FY 2023
        response = auth_client.get(
            url_for("api.projects-group", sort_field="FY_TOTAL", sort_fiscal_year=2023, sort_descending=True, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending
        fy_totals = [
            Decimal(p["fiscal_year_totals"].get("2023", 0)) if p["fiscal_year_totals"] else 0 for p in projects[:3]
        ]
        assert fy_totals == sorted(fy_totals, reverse=True)

    def test_sort_by_project_total(self, auth_client, loaded_db, test_project):
        """Test sorting projects by project total in ascending and descending order."""
        # Add BLIs to test_project
        agreement = test_project.agreements[0]
        bli1 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement.id,
            amount=Decimal("10000.00"),
            date_needed=date.fromisoformat("2023-03-15"),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli1)
        loaded_db.commit()

        # Sort ascending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_TOTAL", sort_descending=False, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted ascending
        totals = [Decimal(p["project_total"]) if p["project_total"] is not None else 0 for p in projects[:3]]
        assert totals == sorted(totals)

        # Sort descending
        response = auth_client.get(
            url_for("api.projects-group", sort_field="PROJECT_TOTAL", sort_descending=True, limit=50)
        )
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted descending
        totals = [Decimal(p["project_total"]) if p["project_total"] is not None else 0 for p in projects[:3]]
        assert totals == sorted(totals, reverse=True)

    def test_sort_without_sort_field_defaults_to_id(self, auth_client, loaded_db):
        """Test that omitting sort_field defaults to sorting by ID."""
        response = auth_client.get(url_for("api.projects-group", limit=50))
        assert response.status_code == 200
        projects = response.json["data"]
        assert len(projects) >= 3

        # Check first 3 are sorted by ID
        ids = [p["id"] for p in projects[:3]]
        assert ids == sorted(ids)


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


# Tests for project_metadata property
class TestProjectMetadata:
    """Test the project_metadata property returned via the API."""

    def test_project_metadata_includes_all_fields(self, auth_client, loaded_db, test_project):
        """Test that project detail endpoint includes all metadata fields from project_metadata."""
        response = auth_client.get(url_for("api.projects-item", id=test_project.id))
        assert response.status_code == 200

        project_data = response.json

        # Verify all project_metadata fields are present
        assert "special_topics" in project_data
        assert "research_methodologies" in project_data
        assert "project_start" in project_data
        assert "project_end" in project_data
        assert "team_members" in project_data
        assert "division_directors" in project_data

    def test_project_metadata_field_types(self, auth_client, loaded_db, test_project):
        """Test that project_metadata fields have correct types in API response."""
        response = auth_client.get(url_for("api.projects-item", id=test_project.id))
        assert response.status_code == 200

        project_data = response.json

        # Verify types
        assert isinstance(project_data["special_topics"], list)
        assert isinstance(project_data["research_methodologies"], list)
        assert isinstance(project_data["team_members"], list)
        assert isinstance(project_data["division_directors"], list)
        # Dates can be strings or None
        assert project_data["project_start"] is None or isinstance(project_data["project_start"], str)
        assert project_data["project_end"] is None or isinstance(project_data["project_end"], str)

    def test_special_topics_aggregation(self, auth_client, loaded_db, test_project):
        """Test that special_topics aggregates unique topics from all agreements."""
        from models import SpecialTopic

        # Get or create special topics
        topic1 = loaded_db.query(SpecialTopic).filter(SpecialTopic.name == "Child Welfare").first()
        topic2 = loaded_db.query(SpecialTopic).filter(SpecialTopic.name == "Early Care and Education").first()

        if not topic1:
            topic1 = SpecialTopic(name="Child Welfare")
            loaded_db.add(topic1)
        if not topic2:
            topic2 = SpecialTopic(name="Early Care and Education")
            loaded_db.add(topic2)
        loaded_db.commit()

        # Add special topics to the first agreement
        agreement1 = test_project.agreements[0]
        agreement1.special_topics.append(topic1)

        # Create a second agreement with overlapping and unique topics
        agreement2 = ContractAgreement(
            name="Second Agreement for Topics",
            project_id=test_project.id,
        )
        loaded_db.add(agreement2)
        loaded_db.commit()

        agreement2.special_topics.append(topic1)  # Duplicate
        agreement2.special_topics.append(topic2)  # Unique
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=test_project.id))
        assert response.status_code == 200

        special_topics = response.json["special_topics"]

        # Should contain unique topics
        assert isinstance(special_topics, list)
        assert "Child Welfare" in special_topics
        assert "Early Care and Education" in special_topics
        # Each topic should appear only once
        assert special_topics.count("Child Welfare") == 1
        assert special_topics.count("Early Care and Education") == 1

    def test_research_methodologies_aggregation(self, auth_client, loaded_db, test_project):
        """Test that research_methodologies aggregates unique methodologies from all agreements."""
        from models import ResearchMethodology

        # Get or create research methodologies
        method1 = loaded_db.query(ResearchMethodology).filter(ResearchMethodology.name == "Survey").first()
        method2 = loaded_db.query(ResearchMethodology).filter(ResearchMethodology.name == "Field Study").first()

        if not method1:
            method1 = ResearchMethodology(name="Survey")
            loaded_db.add(method1)
        if not method2:
            method2 = ResearchMethodology(name="Field Study")
            loaded_db.add(method2)
        loaded_db.commit()

        # Add methodologies to the first agreement
        agreement1 = test_project.agreements[0]
        agreement1.research_methodologies.append(method1)

        # Create a second agreement with overlapping and unique methodologies
        agreement2 = ContractAgreement(
            name="Second Agreement for Methodologies",
            project_id=test_project.id,
        )
        loaded_db.add(agreement2)
        loaded_db.commit()

        agreement2.research_methodologies.append(method1)  # Duplicate
        agreement2.research_methodologies.append(method2)  # Unique
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=test_project.id))
        assert response.status_code == 200

        methodologies = response.json["research_methodologies"]

        # Should contain unique methodologies
        assert isinstance(methodologies, list)
        assert "Survey" in methodologies
        assert "Field Study" in methodologies
        # Each methodology should appear only once
        assert methodologies.count("Survey") == 1
        assert methodologies.count("Field Study") == 1

    def test_project_dates_from_services_components(self, auth_client, loaded_db):
        """Test that project_start and project_end are calculated from services components."""
        from models import ServicesComponent

        # Create a test project
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Test Project Dates",
            short_title="TPD",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Create an agreement for the project
        agreement = ContractAgreement(
            name="Test Agreement for Dates",
            project_id=project.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Add services components with different date ranges
        sc1 = ServicesComponent(
            agreement_id=agreement.id,
            period_start=date.fromisoformat("2023-01-15"),
            period_end=date.fromisoformat("2023-06-30"),
            number=31,
        )
        sc2 = ServicesComponent(
            agreement_id=agreement.id,
            period_start=date.fromisoformat("2022-10-01"),  # Earliest
            period_end=date.fromisoformat("2023-03-31"),
            number=32,
        )
        sc3 = ServicesComponent(
            agreement_id=agreement.id,
            period_start=date.fromisoformat("2023-07-01"),
            period_end=date.fromisoformat("2024-12-31"),  # Latest
            number=33,
        )
        loaded_db.add_all([sc1, sc2, sc3])
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=project.id))
        assert response.status_code == 200

        project_data = response.json

        # project_start should be earliest period_start
        assert project_data["project_start"] == "2022-10-01"

        # project_end should be latest period_end
        assert project_data["project_end"] == "2024-12-31"

    def test_project_dates_none_when_no_services_components(self, auth_client, loaded_db, project_with_no_agreements):
        """Test that project_start and project_end are None when there are no services components."""
        # Call API
        response = auth_client.get(url_for("api.projects-item", id=project_with_no_agreements.id))
        assert response.status_code == 200

        project_data = response.json

        assert project_data["project_start"] is None
        assert project_data["project_end"] is None

    def test_team_members_aggregation(self, auth_client, loaded_db):
        """Test that team_members aggregates unique team members from all agreements."""
        from models import User

        # Create a new project
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Team Members Aggregation Test Project",
            short_title="TMATP",
            description="Test project for team members aggregation",
        )
        loaded_db.add(project)
        loaded_db.commit()

        # Get test users
        user1 = loaded_db.get(User, 500)
        user2 = loaded_db.get(User, 501)
        user3 = loaded_db.get(User, 502)

        # Create first agreement with team members
        agreement1 = ContractAgreement(
            name="First Agreement for Team",
            project_id=project.id,
        )
        loaded_db.add(agreement1)
        loaded_db.commit()

        agreement1.team_members.append(user1)
        agreement1.team_members.append(user2)

        # Create a second agreement with overlapping and unique team members
        agreement2 = ContractAgreement(
            name="Second Agreement for Team",
            project_id=project.id,
        )
        loaded_db.add(agreement2)
        loaded_db.commit()

        agreement2.team_members.append(user2)  # Duplicate
        agreement2.team_members.append(user3)  # Unique
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=project.id))
        assert response.status_code == 200

        team_members = response.json["team_members"]

        # Should be a list with unique team members
        assert isinstance(team_members, list)
        assert len(team_members) == 3  # 3 unique team members

        team_member_ids = [tm["id"] for tm in team_members]
        assert 500 in team_member_ids
        assert 501 in team_member_ids
        assert 502 in team_member_ids

        # Verify each team member has expected fields
        for tm in team_members:
            assert "id" in tm
            assert "full_name" in tm

    def test_division_directors_aggregation(self, auth_client, loaded_db, test_project):
        """Test that division_directors aggregates unique division directors from all agreements."""
        # Get a CAN with a division director
        can = loaded_db.get(CAN, 500)

        # Create BLIs associated with agreements to get division directors
        agreement1 = test_project.agreements[0]

        bli1 = BudgetLineItem(
            budget_line_item_type=AgreementType.CONTRACT,
            agreement_id=agreement1.id,
            can_id=can.id,
            amount=Decimal("1000.00"),
            date_needed=date.fromisoformat("2023-03-15"),
            status=BudgetLineItemStatus.PLANNED,
        )
        loaded_db.add(bli1)
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=test_project.id))
        assert response.status_code == 200

        division_directors = response.json["division_directors"]

        # Should be a list of unique division director names
        assert isinstance(division_directors, list)
        assert len(division_directors) > 0
        # Each director should be a string (full name)
        for director in division_directors:
            assert isinstance(director, str)

    def test_empty_metadata_when_no_agreements(self, auth_client, loaded_db, project_with_no_agreements):
        """Test that project_metadata returns empty collections when project has no agreements."""
        # Call API
        response = auth_client.get(url_for("api.projects-item", id=project_with_no_agreements.id))
        assert response.status_code == 200

        project_data = response.json

        assert isinstance(project_data["special_topics"], list)
        assert len(project_data["special_topics"]) == 0

        assert isinstance(project_data["research_methodologies"], list)
        assert len(project_data["research_methodologies"]) == 0

        assert project_data["project_start"] is None
        assert project_data["project_end"] is None

        assert isinstance(project_data["team_members"], list)
        assert len(project_data["team_members"]) == 0

        assert isinstance(project_data["division_directors"], list)
        assert len(project_data["division_directors"]) == 0

    def test_team_members_no_duplicates(self, auth_client, loaded_db):
        """Test that team_members list contains no duplicate users."""
        from models import User

        # Create a new project
        project = ResearchProject(
            project_type=ProjectType.RESEARCH,
            title="Team Members No Duplicates Test Project",
            short_title="TMNDTP",
            description="Test project for team members deduplication",
        )
        loaded_db.add(project)
        loaded_db.commit()

        user1 = loaded_db.get(User, 500)
        user2 = loaded_db.get(User, 501)

        # Create first agreement with team members
        agreement1 = ContractAgreement(
            name="First Duplicate Team Test",
            project_id=project.id,
        )
        loaded_db.add(agreement1)
        loaded_db.commit()

        agreement1.team_members.append(user1)
        agreement1.team_members.append(user2)

        # Create second agreement with same team members
        agreement2 = ContractAgreement(
            name="Second Duplicate Team Test",
            project_id=project.id,
        )
        loaded_db.add(agreement2)
        loaded_db.commit()

        agreement2.team_members.append(user1)  # Same as agreement1
        agreement2.team_members.append(user2)  # Same as agreement1
        loaded_db.commit()

        # Call API
        response = auth_client.get(url_for("api.projects-item", id=project.id))
        assert response.status_code == 200

        team_members = response.json["team_members"]
        team_member_ids = [tm["id"] for tm in team_members]

        # Each user should appear only once
        assert len(team_members) == 2
        assert team_member_ids.count(500) == 1
        assert team_member_ids.count(501) == 1
