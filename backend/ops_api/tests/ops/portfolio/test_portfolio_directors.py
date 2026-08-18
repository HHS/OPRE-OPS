from models import Division, Portfolio, User, UserStatus
from ops_api.ops.resources.portfolios import add_additional_fields_to_portfolio_response


def _make_user(loaded_db, first_name, last_name, email):
    user = User(first_name=first_name, last_name=last_name, email=email, status=UserStatus.ACTIVE)
    loaded_db.add(user)
    loaded_db.flush()  # assign user.id
    return user


def test_portfolio_division_director_and_deputy(loaded_db, app_ctx):
    director = _make_user(loaded_db, "Dana", "Director", "dana.director@example.com")
    deputy = _make_user(loaded_db, "Dez", "Deputy", "dez.deputy@example.com")

    division = Division(
        name="Test Division With Both",
        abbreviation="TDWB",
        division_director_id=director.id,
        deputy_division_director_id=deputy.id,
    )
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(name="Test Portfolio", abbreviation="TP", division_id=division.id)
    loaded_db.add(portfolio)
    loaded_db.flush()

    assert portfolio.division_director == {"id": director.id, "full_name": "Dana Director"}
    assert portfolio.deputy_division_director == {"id": deputy.id, "full_name": "Dez Deputy"}


def test_portfolio_division_director_missing_deputy(loaded_db, app_ctx):
    director = _make_user(loaded_db, "Only", "Director", "only.director@example.com")

    division = Division(
        name="Test Division Director Only",
        abbreviation="TDDO",
        division_director_id=director.id,
        # deputy_division_director_id intentionally omitted
    )
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(name="Test Portfolio No Deputy", abbreviation="TPND", division_id=division.id)
    loaded_db.add(portfolio)
    loaded_db.flush()

    assert portfolio.division_director == {"id": director.id, "full_name": "Only Director"}
    assert portfolio.deputy_division_director is None


def test_portfolio_division_director_and_deputy_both_unset(loaded_db, app_ctx):
    division = Division(name="Test Division Neither", abbreviation="TDN")
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(name="Test Portfolio Neither", abbreviation="TPN", division_id=division.id)
    loaded_db.add(portfolio)
    loaded_db.flush()

    assert portfolio.division_director is None
    assert portfolio.deputy_division_director is None


def test_portfolio_directors_none_when_division_not_assigned():
    # No division relationship loaded/assigned at all — division is None.
    portfolio = Portfolio(name="No Division Portfolio", abbreviation="NDP")

    assert portfolio.division_director is None
    assert portfolio.deputy_division_director is None


def test_add_additional_fields_includes_division_directors(loaded_db, app_ctx):
    director = _make_user(loaded_db, "Response", "Director", "response.director@example.com")
    deputy = _make_user(loaded_db, "Response", "Deputy", "response.deputy@example.com")

    division = Division(
        name="Response Division",
        abbreviation="RESD",
        division_director_id=director.id,
        deputy_division_director_id=deputy.id,
    )
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(name="Response Portfolio", abbreviation="RESP", division_id=division.id)
    loaded_db.add(portfolio)
    loaded_db.flush()

    additional_fields = add_additional_fields_to_portfolio_response(portfolio)

    assert additional_fields["division_director"] == {"id": director.id, "full_name": "Response Director"}
    assert additional_fields["deputy_division_director"] == {"id": deputy.id, "full_name": "Response Deputy"}


def test_portfolio_get_by_id_includes_director_fields(auth_client, loaded_db, app_ctx):
    director = _make_user(loaded_db, "Api", "Director", "api.director@example.com")

    division = Division(
        name="Api Division",
        abbreviation="APID",
        division_director_id=director.id,
    )
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(name="Api Portfolio", abbreviation="APIP", division_id=division.id)
    loaded_db.add(portfolio)
    loaded_db.commit()

    response = auth_client.get(f"/api/v1/portfolios/{portfolio.id}")

    assert response.status_code == 200
    assert response.json["division_director"] == {"id": director.id, "full_name": "Api Director"}
    assert response.json["deputy_division_director"] is None
