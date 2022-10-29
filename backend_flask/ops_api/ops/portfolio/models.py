from decimal import Decimal
from typing import Optional

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class PortfolioStatus(db.MappedAsDataclass, db.Model):
    __tablename__ = "portfolio_status"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str] = db.mapped_column(unique=True)


class Portfolios(db.MappedAsDataclass, db.Model):
    __tablename__ = "portfolio"
    id: db.Mapped[int] = db.mapped_column(primary_key=True, init=False)
    name: db.Mapped[str] = db.mapped_column(unique=True)
    description: db.Mapped[str] = db.mapped_column(insert_default="", default="")
    status_id: db.Mapped[int] = db.mapped_column(db.ForeignKey("portfolio_status.id"))
    status = db.Mapped["PortfolioStatus"] = db.relationship(back_populates="portfolios")
    current_fiscal_year_funding: db.Mapped[Optional[Decimal]] = db.Column(
        db.Numeric(12, 2),
    )
