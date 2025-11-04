import pytest

from ops_api.ops.services.research_methodology import ResearchMethodologyService


@pytest.mark.usefixtures("app_ctx")
def test_create_research_methodology(loaded_db):
    service = ResearchMethodologyService(loaded_db)

    create_request = {"name": "Qualitative Analysis"}

    new_methodology = service.create(create_request)

    assert new_methodology.id is not None
    assert new_methodology.name == "Qualitative Analysis"


@pytest.mark.usefixtures("app_ctx")
def test_update_research_methodology(loaded_db):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to update
    create_request = {"name": "Initial Methodology"}
    methodology = service.create(create_request)

    # Now, update the ResearchMethodology
    update_fields = {"name": "Updated Methodology"}
    updated_methodology = service.update(update_fields, methodology.id)

    assert updated_methodology.id == methodology.id
    assert updated_methodology.name == "Updated Methodology"


@pytest.mark.usefixtures("app_ctx")
def test_get_research_methodologies(loaded_db):
    service = ResearchMethodologyService(loaded_db)

    # Retrieve the list of ResearchMethodologies
    retrieved_methodologies = service.get_list(limit=10, offset=0)

    assert len(retrieved_methodologies) == 6
    assert (
        retrieved_methodologies[0].name
        == "Capacity Building (Evaluation Technical Assistance, Researcher-Practitioner Partnerships, Dissertation Grants)"
    )
    assert (
        retrieved_methodologies[1].name
        == "Descriptive Study (Foundational Research, Process and Implementation Studies, Cost Analyses, etc.)"
    )

    retrieved_methodologies_2 = service.get_list(limit=10, offset=10)

    assert len(retrieved_methodologies_2) == 0


@pytest.mark.usefixtures("app_ctx")
def test_delete_research_methodology(loaded_db):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to delete
    create_request = {"name": "Methodology to Delete"}
    methodology = service.create(create_request)

    # Now, delete the ResearchMethodology
    service.delete(methodology.id)

    # Attempting to get the deleted ResearchMethodology should raise an error
    with pytest.raises(Exception):
        service.get(methodology.id)


@pytest.mark.usefixtures("app_ctx")
def test_get_research_methodology(loaded_db):
    service = ResearchMethodologyService(loaded_db)

    # First, create a ResearchMethodology to retrieve
    create_request = {"name": "Methodology to Retrieve"}
    methodology = service.create(create_request)

    # Now, retrieve the ResearchMethodology by ID
    retrieved_methodology = service.get(methodology.id)

    assert retrieved_methodology.id == methodology.id
    assert retrieved_methodology.name == "Methodology to Retrieve"
