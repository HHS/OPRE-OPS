from models import BaseModel
from sqlalchemy import Column, DateTime, Identity, Integer, String, func
from sqlalchemy.dialects.postgresql import ENUM, JSONB


class AllBudgetCurrent(BaseModel):
    __tablename__ = "staging_all_budget"

    id = Column(Integer, Identity(), primary_key=True)
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
    verif = Column(String)


class ETLTaskStatus(BaseModel):
    __tablename__ = "staging_etl_task_status"

    workflow_name = Column(String, primary_key=True)
    task_name = Column(String, primary_key=True)
    run_at = Column(DateTime, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())
    task_meta = Column(JSONB)
    status = Column(ENUM("SUCCESS", "FAIL", name="staging_task_status_enum"))
