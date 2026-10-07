from flask import url_for
from sqlalchemy import select

from models import BudgetLineItem


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
