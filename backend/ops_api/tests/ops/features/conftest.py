from pytest_bdd import given


@given("past Obligate By dates are not allowed")
def past_obligate_by_dates_not_allowed(app, monkeypatch):
    monkeypatch.setitem(app.config, "ALLOW_PAST_OBLIGATE_BY_DATES", False)
