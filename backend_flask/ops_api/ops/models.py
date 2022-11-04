from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Role(db.Model):
    __tablename__ = "role"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)


class Division(db.Model):
    __tablename__ = "division"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)


person_roles = db.Table(
    "ops_person_roles",
    db.Model.metadata,
    db.Column("role_id", db.ForeignKey("role.id"), primary_key=True),
    db.Column("person_id", db.ForeignKey("person.id"), primary_key=True),
)


class Person(db.Model):
    __tablename__ = "person"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String)
    last_name = db.Column(db.String)
    roles = db.relationship(
        "Role",
        secondary=person_roles,
        back_populates="persons",
    )
    division_id = db.Column(db.Integer, db.ForeignKey("division.id"))
    division = db.relationship("Division", back_populates="persons")
