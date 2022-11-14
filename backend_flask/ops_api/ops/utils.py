from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def keyvalgen(obj):
    """ Generate attr name/val pairs, filtering out SQLA attrs."""
    excl = ('_sa_adapter', '_sa_instance_state')
    for k, v in vars(obj).items():
        if not k.startswith('_') and not any(hasattr(v, a) for a in excl):
            yield k, v


class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_on = db.Column(db.DateTime, default=db.func.now())
    updated_on = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    def __repr__(self):
        params = ', '.join(f'{k}={v}' for k, v in keyvalgen(self))
        return f"{self.__class__.__name__}({params})"
