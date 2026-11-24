import uuid

from flask import url_for
from sqlalchemy import text

from models import AdministrativeAndSupportProject, Project, ProjectType, ResearchProject, TechnicalAssistanceProject


def test_post_technical_assistance_project(auth_client, loaded_db):
    data = {
        "project_type": ProjectType.TECHNICAL_ASSISTANCE.name,
        "title": "Technical Assistance Project #1",
        "short_title": "TA1" + uuid.uuid4().hex,
        "description": "blah blah blah",
        "origination_date": "2024-01-01",
        "team_leaders": [{"id": 500}],
    }
    response = auth_client.post(url_for("api.projects-group"), json=data)
    assert response.status_code == 201

    project = loaded_db.get(TechnicalAssistanceProject, response.json["id"])
    assert project is not None
    assert project.project_type == ProjectType.TECHNICAL_ASSISTANCE
    assert project.title == "Technical Assistance Project #1"
    assert [tl.id for tl in project.team_leaders] == [500]


def test_list_projects_filtered_by_technical_assistance(auth_client, loaded_db):
    project = TechnicalAssistanceProject(
        project_type=ProjectType.TECHNICAL_ASSISTANCE,
        title="TA list filter",
        short_title="TALF" + uuid.uuid4().hex,
    )
    loaded_db.add(project)
    loaded_db.commit()

    response = auth_client.get(
        url_for("api.projects-group", project_type=[ProjectType.TECHNICAL_ASSISTANCE.name], limit=50)
    )
    assert response.status_code == 200
    data = response.json["data"]
    assert project.id in [p["id"] for p in data]
    assert {p["project_type"] for p in data} == {ProjectType.TECHNICAL_ASSISTANCE.name}
    summary = response.json["summary"]["projects_by_type"]
    assert summary[ProjectType.TECHNICAL_ASSISTANCE.name] == len(data)


def test_change_type_into_and_out_of_technical_assistance(budget_team_auth_client, loaded_db):
    project = ResearchProject(
        project_type=ProjectType.RESEARCH,
        title="Version Test R2T",
        short_title="VTR2T" + uuid.uuid4().hex,
        description="Test type change into technical assistance",
    )
    loaded_db.add(project)
    loaded_db.commit()
    loaded_db.refresh(project)
    project_id = project.id

    response = budget_team_auth_client.patch(
        url_for("api.projects-item", id=project_id), json={"project_type": ProjectType.TECHNICAL_ASSISTANCE.name}
    )
    assert response.status_code == 200

    loaded_db.expire_all()
    changed = loaded_db.get(Project, project_id)
    assert changed.project_type == ProjectType.TECHNICAL_ASSISTANCE
    assert isinstance(changed, TechnicalAssistanceProject)

    # parent version row is an UPDATE to the new type; the new subclass version row is an INSERT
    pv = loaded_db.execute(
        text(
            "SELECT project_type, operation_type FROM project_version"
            " WHERE id = :id ORDER BY transaction_id DESC LIMIT 1"
        ),
        {"id": project_id},
    ).one()
    assert pv == ("TECHNICAL_ASSISTANCE", Project._OP_UPDATE)
    tapv = loaded_db.execute(
        text(
            "SELECT operation_type FROM technical_assistance_project_version"
            " WHERE id = :id ORDER BY transaction_id DESC LIMIT 1"
        ),
        {"id": project_id},
    ).scalar()
    assert tapv == Project._OP_INSERT

    # and back out: the technical assistance row is removed and a DELETE version row is recorded
    response = budget_team_auth_client.patch(
        url_for("api.projects-item", id=project_id), json={"project_type": ProjectType.ADMINISTRATIVE.name}
    )
    assert response.status_code == 200

    loaded_db.expire_all()
    assert isinstance(loaded_db.get(Project, project_id), AdministrativeAndSupportProject)
    assert (
        loaded_db.execute(
            text("SELECT count(*) FROM technical_assistance_project WHERE id = :id"), {"id": project_id}
        ).scalar()
        == 0
    )
    tapv = loaded_db.execute(
        text(
            "SELECT operation_type FROM technical_assistance_project_version"
            " WHERE id = :id ORDER BY transaction_id DESC LIMIT 1"
        ),
        {"id": project_id},
    ).scalar()
    assert tapv == Project._OP_DELETE
