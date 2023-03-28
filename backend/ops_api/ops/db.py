from typing import Optional

from models import *  # noqa: F403, F401
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, scoped_session, sessionmaker


def init_db(conn_string: str, is_unit_test: Optional[bool] = False) -> Session:
    engine = create_engine(conn_string)
    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    Base = declarative_base(cls=BaseModel)  # noqa: F405
    BaseModel.query = db_session.query_property()  # noqa: F405
    if is_unit_test:
        Base.metadata.create_all(bind=engine)

    return db_session
