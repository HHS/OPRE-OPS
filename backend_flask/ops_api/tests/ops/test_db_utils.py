from ops.utils import BaseModel
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import relationship


def test_serialize_mixin(db_session, db_engine):
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

    BaseModel.metadata.create_all(db_engine)

    bob = User(name="Bob", knowledge_word="pass123")
    db_session.add(bob)
    db_session.flush()

    post1 = Post(body="Post 1", user=bob)
    db_session.add(post1)
    db_session.flush()

    post2 = Post(body="Post 2", user=bob)
    db_session.add(post2)
    db_session.flush()

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
