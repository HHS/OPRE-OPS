import pytest
from flask import url_for

from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.services.special_topics import SpecialTopicsService


def test_create_special_topic(loaded_db, app_ctx):
    service = SpecialTopicsService(loaded_db)

    create_request = {"name": "Special Topic (Special Population)"}

    new_special_topic = service.create(create_request)

    assert new_special_topic.id is not None
    assert new_special_topic.name == "Special Topic (Special Population)"

    service.delete(new_special_topic.id)


def test_update_special_topic(loaded_db, app_ctx):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to update
    create_request = {"name": "Initial Topic"}
    topic = service.create(create_request)

    # Now, update the SpecialTopic
    update_fields = {"name": "Updated Topic"}
    updated_topic = service.update(update_fields, topic.id)

    assert updated_topic.id == topic.id
    assert updated_topic.name == "Updated Topic"

    service.delete(topic.id)


def test_get_special_topics(loaded_db, app_ctx):
    service = SpecialTopicsService(loaded_db)

    # Retrieve the list of SpecialTopics
    retrieved_topics = service.get_list(limit=10, offset=0)

    assert len(retrieved_topics) == 4
    assert retrieved_topics[0].name == "Special Topic 1"
    assert retrieved_topics[1].name == "Special Topic 2"

    retrieved_topics_2 = service.get_list(limit=10, offset=10)

    assert len(retrieved_topics_2) == 0


def test_delete_special_topic(loaded_db, app_ctx):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to delete
    create_request = {"name": "Topic to Delete"}
    topic = service.create(create_request)

    # Now, delete the SpecialTopic
    service.delete(topic.id)

    # Attempting to get the deleted SpecialTopic should raise an error
    with pytest.raises(ResourceNotFoundError):
        service.get(topic.id)


def test_get_special_topic(loaded_db, app_ctx):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to retrieve
    create_request = {"name": "Topic to Retrieve"}
    topic = service.create(create_request)

    # Now, retrieve the SpecialTopic by ID
    retrieved_topic = service.get(topic.id)

    assert retrieved_topic.id == topic.id
    assert retrieved_topic.name == "Topic to Retrieve"


def test_get_special_topics_api(loaded_db, auth_client, app_ctx):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to retrieve via API
    create_request = {"name": "API Special Topic to Retrieve"}
    topic = service.create(create_request)

    url_get_one = url_for("api.special-topics-item", id=topic.id)

    # Now, retrieve the SpecialTopic by ID via API
    response = auth_client.get(url_get_one)
    assert response.status_code == 200

    data = response.get_json()
    assert data["id"] == topic.id
    assert data["name"] == "API Special Topic to Retrieve"

    service.delete(topic.id)


def test_get_special_topic_404(auth_client, app_ctx):
    url = url_for("api.special-topics-item", id=9999)
    response = auth_client.get(url)
    assert response.status_code == 404


def test_get_special_topics_list_api(loaded_db, auth_client, app_ctx):

    url = url_for("api.special-topics-list")

    # Retrieve the list of SpecialTopics via API
    response = auth_client.get(url, query_string={"limit": 10, "offset": 0})
    assert response.status_code == 200

    data = response.get_json()
    assert data[0]["name"] == "Special Topic 1"
    assert data[1]["name"] == "Special Topic 2"
