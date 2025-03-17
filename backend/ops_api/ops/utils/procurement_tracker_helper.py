from flask import current_app

from models import Agreement
from models.procurement_tracker import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementTracker,
    Solicitation,
)

procurement_step_classes = [
    AcquisitionPlanning,
    PreSolicitation,
    Solicitation,
    Evaluation,
    PreAward,
    Award,
]


def create_procurement_tracker(agreement_id) -> ProcurementTracker:
    session = current_app.db_session
    agreement = session.get(Agreement, agreement_id)
    if not agreement:
        raise ValueError("Invalid Agreement ID")

    # if it already exists, just return it
    if agreement.procurement_tracker_id:
        return session.get(ProcurementTracker, agreement.procurement_tracker_id)

    procurement_tracker = ProcurementTracker(agreement_id=agreement_id)
    session.add(procurement_tracker)
    session.commit()

    for procurement_step_class in procurement_step_classes:
        proc_step = procurement_step_class()
        proc_step.agreement_id = agreement_id
        proc_step.procurement_tracker = procurement_tracker
        session.add(proc_step)
        session.commit()
        if not proc_step.id:
            raise ValueError(f"Failed to create {procurement_step_class.__name__} - ID not generated")

    return procurement_tracker


def delete_procurement_tracker(agreement_id):
    session = current_app.db_session
    agreement = session.get(Agreement, agreement_id)
    if not agreement.procurement_tracker_id:
        return

    proc_tracker = session.get(ProcurementTracker, agreement.procurement_tracker_id)
    # remove procurement steps
    for proc_step in proc_tracker.procurement_steps:
        session.delete(proc_step)
    # remove procurement tracker
    session.delete(proc_tracker)
    session.commit()
