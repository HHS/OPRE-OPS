from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
reg = db.registry()


@reg.mapped_as_dataclass
class Role(db.Model):
    __tablename__ = "role"
    name: db.Mapped[str] = db.mapped_column()


class Division(db.Model):
    __tablename__ = "division"
    name: db.Mapped[str] = db.mapped_column()


class Person(db.Model):
    __tablename__ = "person"
    first_name: db.Mapped[str] = db.mapped_column()
    last_name: db.Mapped[str] = db.mapped_column()
    role_ids = ..
    division_id = db.Column(db.Integer, db.ForeignKey("division.id"))
