from model_bakery import baker
import pytest
from rest_framework.test import APIClient

from opre_ops.ops_site.cans.models import CommonAccountingNumber as CAN


client = APIClient()


# @pytest.fixture()
# def can(db):
#     return baker.make(CAN)


# def test_using_can(can):
#     assert isinstance(can, CAN)  # noqa: S101,S307


# def test_api_getAllCans(can):
#     response = client.get("/ops/cans")
#     assert response.status_code == 200  # noqa: S101,S307
