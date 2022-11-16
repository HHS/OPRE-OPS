from ops.utils import BaseModel
from ops.utils import db
import pytest
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import relationship


@pytest.mark.usefixtures("app_ctx")
def test_serialize_mixin(loaded_db):
    class User(BaseModel):
        __tablename__ = "user"
        id = Column(Integer, primary_key=True)
        knowledge_word = Column(String)
        name = Column(String)
        posts = relationship("Post", backref="user")

    class Post(BaseModel):
        __tablename__ = "post"
        id = Column(Integer, primary_key=True)
        body = Column(String)
        user_id = Column(Integer, ForeignKey("user.id"))

    # BaseModel.metadata.create_all(db_engine)
    User.metadata.create_all(db.engine)
    Post.metadata.create_all(db.engine)

    bob = User(name="Bob", knowledge_word="pass123")
    loaded_db.session.add(bob)
    loaded_db.session.flush()

    post1 = Post(body="Post 1", user=bob)
    loaded_db.session.add(post1)
    loaded_db.session.flush()

    post2 = Post(body="Post 2", user=bob)
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
