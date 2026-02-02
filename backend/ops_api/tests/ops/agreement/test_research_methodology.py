import pytest
from flask import url_for

from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.services.research_methodology import ResearchMethodologyService


def test_create_research_methodology(loaded_db, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    create_request = {"name": "Qualitative Analysis", "detailed_name": "Qualitative Analysis"}

    new_methodology = service.create(create_request)

    assert new_methodology.id is not None
    assert new_methodology.name == "Qualitative Analysis"
    service.delete(new_methodology.id)


def test_update_research_methodology(loaded_db, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to update
    create_request = {"name": "Initial Methodology", "detailed_name": "Initial Methodology"}
    methodology = service.create(create_request)

    # Now, update the ResearchMethodology
    update_fields = {"name": "Updated Methodology", "detailed_name": "Updated Methodology"}
    updated_methodology = service.update(update_fields, methodology.id)

    assert updated_methodology.id == methodology.id
    assert updated_methodology.name == "Updated Methodology"
    service.delete(methodology.id)


def test_get_research_methodologies(loaded_db, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    # Retrieve the list of ResearchMethodologies
    retrieved_methodologies = service.get_list(limit=10, offset=0)

    assert len(retrieved_methodologies) == 6
    assert retrieved_methodologies[0].name == "Capacity Building"
    assert retrieved_methodologies[1].name == "Descriptive Study"

    retrieved_methodologies_2 = service.get_list(limit=10, offset=10)

    assert len(retrieved_methodologies_2) == 0


def test_delete_research_methodology(loaded_db, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to delete
    create_request = {"name": "Methodology to Delete", "detailed_name": "Methodology to Delete"}
    methodology = service.create(create_request)

    # Now, delete the ResearchMethodology
    service.delete(methodology.id)

    # Attempting to get the deleted ResearchMethodology should raise an error
    with pytest.raises(ResourceNotFoundError):
        service.get(methodology.id)


def test_get_research_methodology(loaded_db, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to retrieve
    create_request = {"name": "Methodology to Retrieve", "detailed_name": "Methodology to Retrieve"}
    methodology = service.create(create_request)

    # Now, retrieve the ResearchMethodology by ID
    retrieved_methodology = service.get(methodology.id)

    assert retrieved_methodology.id == methodology.id
    assert retrieved_methodology.name == "Methodology to Retrieve"
    service.delete(methodology.id)


def test_get_research_methodology_api(loaded_db, auth_client, app_ctx):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to retrieve via API
    create_request = {"name": "API Methodology to Retrieve", "detailed_name": "API Methodology to Retrieve"}
    methodology = service.create(create_request)

    url_get_one = url_for("api.research-methodology-item", id=methodology.id)

    # Now, retrieve the ResearchMethodology by ID via API
    response = auth_client.get(url_get_one)
    assert response.status_code == 200

    data = response.get_json()
    assert data["id"] == methodology.id
    assert data["name"] == "API Methodology to Retrieve"
    service.delete(methodology.id)


def test_get_research_methodology_404(auth_client, app_ctx):
    url = url_for("api.research-methodology-item", id=9999)
    response = auth_client.get(url)
    assert response.status_code == 404


def test_get_research_methodology_list_api(loaded_db, auth_client, app_ctx):

    url = url_for("api.research-methodology-list")

    # Retrieve the list of ResearchMethodologies via API
    response = auth_client.get(url, query_string={"limit": 10, "offset": 0})
    assert response.status_code == 200

    data = response.get_json()
    assert data[0]["name"] == "Capacity Building"
    assert data[1]["name"] == "Descriptive Study"
