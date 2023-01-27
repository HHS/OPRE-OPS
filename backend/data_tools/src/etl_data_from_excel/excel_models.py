from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import declarative_base

# declarative base class
Base = declarative_base()


# an example mapping using the base
class AllBudgetCur(Base):
    __tablename__ = "staging_all_budget"

    CAN = Column(String)
    Sys_Budget_ID = Column(String)
    Project_Title = Column(String)
    CIG_Name = Column(String)
    CIG_Type = Column(String)
    Line_Desc = Column(String)
    Date_Needed = Column(String)
    Amount = Column(String)
    PSCFee_Amount = Column(String)
    Status = Column(String)
    Comments = Column(String)
    Total_Bud_Cur = Column(String)
    All_Bud_Prev = Column(String)
    Delta = Column(String)
