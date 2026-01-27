import pytest
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from models.base import BaseModel
from ops_api.ops import db


@pytest.mark.skip("Refactor me.")
def test_serialize_mixin(loaded_db, app_ctx):
    class XUser(BaseModel):
        __tablename__ = "test_user"
        id = Column(Integer, primary_key=True)
        knowledge_word = Column(String)
        name = Column(String)
        posts = relationship("XPost", backref="user")

    class XPost(BaseModel):
        __tablename__ = "test_post"
        id = Column(Integer, primary_key=True)
        body = Column(String)
        user_id = Column(Integer, ForeignKey("test_user.id"))

    # BaseModel.metadata.create_all(db_engine)
    XUser.metadata.create_all(db.engine)
    XPost.metadata.create_all(db.engine)

    bob = XUser(name="Bob", knowledge_word="pass123")
    loaded_db.session.add(bob)
    loaded_db.session.flush()

    post1 = XPost(body="Post 1", user=bob)
    loaded_db.session.add(post1)
    loaded_db.session.flush()

    post2 = XPost(body="Post 2", user=bob)
    loaded_db.session.add(post2)
    loaded_db.session.flush()

    serialize = bob.to_dict()
    assert serialize == {"id": 1, "name": "Bob", "knowledge_word": "pass123"}

    serialize = bob.to_dict(nested=True, exclude=["knowledge_word"])
    assert serialize == {
        "id": 1,
        "name": "Bob",
        "posts": [
            {"body": "Post 1", "id": 1, "user_id": 1},
            {"body": "Post 2", "id": 2, "user_id": 1},
        ],
    }

    serialize = post1.to_dict()
    assert serialize == {"id": 1, "body": "Post 1", "user_id": 1}
