import pytest

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
from ops_api.ops.utils.procurement_tracker_helper import create_procurement_tracker, delete_procurement_tracker


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_create_procurement_tracker(loaded_db, auth_client):
    test_agreement_id = 1
    procurement_tracker: ProcurementTracker = create_procurement_tracker(test_agreement_id)
    assert procurement_tracker.id is not None
    procurement_tracker_id = procurement_tracker.id

    steps = procurement_tracker.procurement_steps
    assert len(steps) == 6
    assert steps[0].__class__ == AcquisitionPlanning
    assert steps[1].__class__ == PreSolicitation
    assert steps[2].__class__ == Solicitation
    assert steps[3].__class__ == Evaluation
    assert steps[4].__class__ == PreAward
    assert steps[5].__class__ == Award

    # delete workflow
    delete_procurement_tracker(test_agreement_id)

    # verify removal
    agreement = loaded_db.get(Agreement, test_agreement_id)
    assert agreement.procurement_tracker_id is None
    procurement_tracker = loaded_db.get(ProcurementTracker, procurement_tracker_id)
    assert procurement_tracker is None
