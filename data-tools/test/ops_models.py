from environment.dev import DATABASE_URL
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

# Models here are for testing/development purposes while backend is being
# ported to SQLAlchemy

Base = declarative_base()

engine = create_engine(DATABASE_URL, echo=True, future=True)


class PortfolioStatus(Base):
    __tablename__ = "portfolio_status"
    id = Column(Integer, primary_key=True)
    name = Column(String(30), unique=True)


class Division(Base):
    __tablename__ = "division"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    abbreviation = Column(String(10), unique=True)


class Portfolios(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True)
    abbreviation = Column(String(10), unique=True)
    division_id = Column(Integer, ForeignKey("division.id"))
    division = relationship(
        "Division", back_populates="divisions", cascade="all, delete-orphan"
    )
    description = Column(Text, default="")
    status_id = Column(Integer, ForeignKey("portfolio_status.id"))
    status = relationship("PortfolioStatus", back_populates="portfolios")
    url = relationship("PortfolioUrl", back_populates="portfolio")


class PortfolioUrl(Base):
    __tablename__ = "portfolio_url"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    portfolio = relationship("Portfolio", back_populates="links")
    url = Column(String)


class FundingPartner(Base):
    __tablename__ = "funding_partner"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100))


Base.metadata.create_all(engine)
