import pytest

from models.workflows import Package, PackageSnapshot


@pytest.mark.usefixtures("app_ctx")
def test_package_retrieve(auth_client, loaded_db):
    package = loaded_db.get(Package, 1)

    assert package is not None
    assert package.notes == "Urgent approval needed"
    assert package.submitter_id == 520
    assert package.workflow_instance_id == 1
    assert package.package_snapshots is not None


@pytest.mark.usefixtures("app_ctx")
def test_package_snapshot_retrieve(auth_client, loaded_db):
    package_snapshot = loaded_db.get(PackageSnapshot, 1)

    assert package_snapshot is not None
    assert package_snapshot.version == 1
    assert package_snapshot.bli_id == 15022
    assert package_snapshot.package_id == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_packages_by_id(auth_client):
    response = auth_client.get("/api/v1/packages/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_package_snapshots_by_id(auth_client):
    response = auth_client.get("/api/v1/package-snapshots/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
