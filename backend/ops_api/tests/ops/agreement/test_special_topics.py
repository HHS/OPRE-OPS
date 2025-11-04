import pytest

from ops_api.ops.services.special_topics import SpecialTopicsService


@pytest.mark.usefixtures("app_ctx")
def test_create_special_topic(loaded_db):
    service = SpecialTopicsService(loaded_db)

    create_request = {"name": "Special Topic (Special Population)"}

    new_special_topic = service.create(create_request)

    assert new_special_topic.id is not None
    assert new_special_topic.name == "Special Topic (Special Population)"


@pytest.mark.usefixtures("app_ctx")
def test_update_special_topic(loaded_db):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to update
    create_request = {"name": "Initial Topic"}
    topic = service.create(create_request)

    # Now, update the SpecialTopic
    update_fields = {"name": "Updated Topic"}
    updated_topic = service.update(update_fields, topic.id)

    assert updated_topic.id == topic.id
    assert updated_topic.name == "Updated Topic"


@pytest.mark.usefixtures("app_ctx")
def test_get_special_topics(loaded_db):
    service = SpecialTopicsService(loaded_db)

    # Retrieve the list of SpecialTopics
    retrieved_topics = service.get_list(limit=10, offset=0)

    assert len(retrieved_topics) == 4
    assert retrieved_topics[0].name == "Special Topic 1"
    assert retrieved_topics[1].name == "Special Topic 2"

    retrieved_topics_2 = service.get_list(limit=10, offset=10)

    assert len(retrieved_topics_2) == 0


@pytest.mark.usefixtures("app_ctx")
def test_delete_special_topic(loaded_db):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to delete
    create_request = {"name": "Topic to Delete"}
    topic = service.create(create_request)

    # Now, delete the SpecialTopic
    service.delete(topic.id)

    # Attempting to get the deleted SpecialTopic should raise an error
    with pytest.raises(Exception):
        service.get(topic.id)


@pytest.mark.usefixtures("app_ctx")
def test_get_special_topic(loaded_db):
    service = SpecialTopicsService(loaded_db)

    # First, create a SpecialTopic to retrieve
    create_request = {"name": "Topic to Retrieve"}
    topic = service.create(create_request)

    # Now, retrieve the SpecialTopic by ID
    retrieved_topic = service.get(topic.id)

    assert retrieved_topic.id == topic.id
    assert retrieved_topic.name == "Topic to Retrieve"
