from ops.utils import db
from sqlalchemy.engine import Connection


class PortfolioStatus(db.Model):
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


class Portfolio(db.Model):
    __tablename__ = "portfolio"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    description = db.Column(db.String, default="")
    status_id = db.Column(db.Integer, db.ForeignKey("portfolio_status.id"))
    status = db.relationship("PortfolioStatus")
    current_fiscal_year_funding = db.Column(db.Numeric(12, 2))
    cans = db.relationship("CAN", back_populates="portfolio")
