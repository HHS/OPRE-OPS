from ops.utils import BaseModel
from ops.utils import db
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Table
from sqlalchemy import Text
from sqlalchemy.engine import Connection
from typing_extensions import override


class Division(BaseModel):
    __tablename__ = "division"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    abbreviation = db.Column(db.String(10), unique=True)
    portfolio = db.relationship("Portfolio", back_populates="division")


class PortfolioUrl(BaseModel):
    __tablename__ = "portfolio_url"
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey("portfolio.id"))
    portfolio = db.relationship("Portfolio", back_populates="urls")
    url = db.Column(db.String)


class PortfolioStatus(BaseModel):
    __tablename__ = "portfolio_status"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)

    @staticmethod
    def initial_data(
        target: db.Table,
        connection: Connection,
        **kwargs: dict,
    ) -> None:
        connection.execute(
            target.insert(),
            {"id": 1, "name": "In-Process"},
            {"id": 2, "name": "Not-Started"},
            {"id": 3, "name": "Sandbox"},
        )


db.event.listen(
    PortfolioStatus.__table__,
    "after_create",
    PortfolioStatus.initial_data,
)


portfolio_cans = Table(
    "portfolio_cans",
    db.Model.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)


class Portfolio(BaseModel):
    __tablename__ = "portfolio"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey("portfolio_status.id"))
    status = db.relationship("PortfolioStatus")
    cans = db.relationship(
        "CAN", back_populates="shared_portfolios", secondary=portfolio_cans
    )
    division_id = db.Column(db.Integer, db.ForeignKey("division.id"))
    division = db.relationship("Division", back_populates="portfolio")
    urls = db.relationship("PortfolioUrl")
    description = db.relationship(
        "PortfolioDescriptionText", back_populates="portfolio"
    )

    @override
    def to_dict(self):
        d = super().to_dict()

        d.update(
            {
                "description": [
                    description.to_dict() for description in self.description
                ],
                "urls": [url.to_dict() for url in self.urls],
                "division": self.division.to_dict(),
                "cans": [can.to_dict() for can in self.cans],
                "status": self.status.name,
            }
        )

        return d


class PortfolioDescriptionText(db.Model):
    __tablename__ = "portfolio_description_text"
    id = db.Column(db.Integer, primary_key=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey("portfolio.id"))
    paragraph_number = db.Column(db.Integer)
    text = db.Column(Text)
    portfolio = db.relationship("Portfolio", back_populates="description")
