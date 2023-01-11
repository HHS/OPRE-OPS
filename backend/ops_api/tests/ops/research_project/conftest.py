from datetime import date

from ops.models.base import db
from ops.models.cans import CAN
from ops.models.research_projects import MethodologyType
from ops.models.research_projects import PopulationType
from ops.models.research_projects import ResearchProject
import pytest


@pytest.fixture()
def db_with_research_projects(app, loaded_db):
    with app.app_context():
        proj_1 = ResearchProject(
            id=1,
            title="Project 1",
            short_title="ABC",
            description="Vae, salvus orexis!",
            portfolio_id=1,
            url="https://example.com",
            origination_date=date(2000, 1, 1),
        )

        method_1 = MethodologyType(
            name="type 1",
            description="Cursuss mori in tolosa!"
        )

        pop_1 = PopulationType(
            name="pop 1",
            description="Emeritis parmas ducunt ad rumor."
        )

        can = CAN(
            number="ABCDEFG",
            expiration_date=date(2000, 1, 1)
        )

        proj_1.methodologies.append(method_1)
        proj_1.populations.append(pop_1)
        proj_1.cans.append(can)

        db.session.add(proj_1)

        db.session.flush()
        yield db
