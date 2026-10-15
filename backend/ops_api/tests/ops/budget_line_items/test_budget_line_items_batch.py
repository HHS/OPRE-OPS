import datetime

from flask import url_for
from sqlalchemy import event, select

from models import (
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    GrantAgreement,
    GrantNumber,
)
from models.budget_line_items import ContractBudgetLineItem, GrantBudgetLineItem
from models.services_components import CLIN
from ops_api.ops.schemas.budget_line_items import BudgetLineItemListResponseSchema
from ops_api.ops.services.budget_line_items import BudgetLineItemService


def test_post_budget_line_items_batch_returns_full_objects(auth_client, test_bli, app_ctx):
    response = auth_client.post(url_for("api.budget-line-items-batch"), json={"ids": [test_bli.id]})
    assert response.status_code == 200
    assert len(response.json) == 1
    bli = response.json[0]
    assert bli["id"] == test_bli.id
    assert "agreement" in bli
    assert "can" in bli
    assert "amount" in bli
    assert "_meta" in bli


def test_post_budget_line_items_batch_multiple_ids(auth_client, loaded_db, app_ctx):
    bli_ids = loaded_db.scalars(select(BudgetLineItem.id).limit(3)).all()

    response = auth_client.post(url_for("api.budget-line-items-batch"), json={"ids": bli_ids})
    assert response.status_code == 200
    assert {bli["id"] for bli in response.json} == set(bli_ids)


def test_post_budget_line_items_batch_omits_unknown_ids(auth_client, test_bli, app_ctx):
    response = auth_client.post(
        url_for("api.budget-line-items-batch"),
        json={"ids": [test_bli.id, 999999999]},
    )
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == test_bli.id


def test_post_budget_line_items_batch_rejects_empty_ids(auth_client, app_ctx):
    response = auth_client.post(url_for("api.budget-line-items-batch"), json={"ids": []})
    assert response.status_code == 400


def test_post_budget_line_items_batch_rejects_too_many_ids(auth_client, app_ctx):
    response = auth_client.post(url_for("api.budget-line-items-batch"), json={"ids": list(range(1, 52))})
    assert response.status_code == 400


def test_post_budget_line_items_batch_auth_required(client):
    response = client.post("/api/v1/budget-line-items-batch/", json={"ids": [1]})
    assert response.status_code == 401


def test_get_budget_line_items_batch_not_allowed(auth_client, app_ctx):
    response = auth_client.get(url_for("api.budget-line-items-batch"))
    assert response.status_code == 405


def test_get_batch_eager_loads_clin_and_grant_number(loaded_db, test_project, test_can, test_admin_user, app_ctx):
    """
    clin (base BLI) and grant_number (GrantBudgetLineItem subclass) must be eager-loaded
    by get_batch, same as the other relationships. Without it, serializing a batch would
    issue one extra lazy-load query per distinct clin_id/grant_number_id in the batch.
    """
    contract_agreement = ContractAgreement(
        name="N+1-probe-contract",
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.flush()

    clin = CLIN(agreement_id=contract_agreement.id, number=1, name="N+1 probe CLIN")
    loaded_db.add(clin)
    loaded_db.flush()

    grant_agreement = GrantAgreement(
        name="N+1-probe-grant",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(grant_agreement)
    loaded_db.flush()

    grant_number = GrantNumber(agreement_id=grant_agreement.id, number=1, description="N+1 probe grant number")
    loaded_db.add(grant_number)
    loaded_db.flush()

    contract_bli = ContractBudgetLineItem(
        line_description="N+1 probe contract BLI",
        agreement_id=contract_agreement.id,
        clin_id=clin.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=test_admin_user.id,
    )
    grant_bli = GrantBudgetLineItem(
        line_description="N+1 probe grant BLI",
        agreement_id=grant_agreement.id,
        grant_number_id=grant_number.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=test_admin_user.id,
    )
    loaded_db.add_all([contract_bli, grant_bli])
    loaded_db.flush()
    loaded_db.expire_all()

    service = BudgetLineItemService(loaded_db)
    budget_line_items = service.get_batch([contract_bli.id, grant_bli.id])

    queries = []

    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        queries.append(statement)

    event.listen(loaded_db.get_bind(), "before_cursor_execute", before_cursor_execute)
    try:
        result = BudgetLineItemListResponseSchema(many=True).dump(budget_line_items)
    finally:
        event.remove(loaded_db.get_bind(), "before_cursor_execute", before_cursor_execute)

    assert not any("FROM clin" in q for q in queries)
    assert not any("FROM grant_number" in q for q in queries)

    by_id = {bli["id"]: bli for bli in result}
    assert by_id[contract_bli.id]["clin"]["id"] == clin.id
    assert by_id[grant_bli.id]["grant_number"]["id"] == grant_number.id


def test_post_budget_line_items_batch_query_count_does_not_scale_with_batch_size(auth_client, loaded_db, app_ctx):
    """
    Regression test for the per-row N+1 this endpoint used to have: in_review and
    change_requests_in_review were dumped from BLI model properties (1-2 fresh queries
    each, every call) and the agreement-association check was re-run per row instead of
    once per distinct agreement. That made query count scale roughly linearly with batch
    size. Both are now batch-loaded/cached once per request, so a 10x larger batch should
    cost at most a handful more queries, not ~1-2 extra per added row.
    """
    all_ids = loaded_db.scalars(select(BudgetLineItem.id).order_by(BudgetLineItem.id)).all()
    assert len(all_ids) >= 56, "loaded_db fixture data shrank below what this test needs"

    def count_queries(ids):
        queries = []

        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            queries.append(statement)

        event.listen(loaded_db.get_bind(), "before_cursor_execute", before_cursor_execute)
        try:
            response = auth_client.post(url_for("api.budget-line-items-batch"), json={"ids": ids})
        finally:
            event.remove(loaded_db.get_bind(), "before_cursor_execute", before_cursor_execute)
        assert response.status_code == 200
        return len(queries)

    # Warm up the session (user/role lookups, etc.) so that one-time setup cost isn't
    # attributed to whichever batch happens to run first.
    count_queries(all_ids[:1])

    few_ids = all_ids[1:6]  # 5 ids
    many_ids = all_ids[6:56]  # 50 ids, 10x the batch, disjoint from few_ids

    queries_for_few = count_queries(few_ids)
    queries_for_many = count_queries(many_ids)

    assert queries_for_many <= queries_for_few + 20, (
        f"query count scaled with batch size: {queries_for_few} queries for {len(few_ids)} ids "
        f"vs {queries_for_many} queries for {len(many_ids)} ids"
    )
