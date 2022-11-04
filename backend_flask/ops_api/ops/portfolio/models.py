from ops.utils import db


class PortfolioStatus(db.Model):
    __tablename__ = "portfolio_status"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)


class Portfolios(db.Model):
    __tablename__ = "portfolio"
    id = db.mapped_column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    description = db.Column(db.String, default="")
    status_id = db.Column(db.Integer, db.ForeignKey("portfolio_status.id"))
    status = db.relationship("PortfolioStatus", back_populates="portfolios")
    current_fiscal_year_funding = db.Column(db.Numeric(12, 2))
