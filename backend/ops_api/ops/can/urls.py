from flask import Blueprint

bp = Blueprint(
    "cans",
    __name__,
    url_prefix="/ops",
)
# CANs
# bp.add_url_rule("/cans/", view_func=views.get_all_cans)
# bp.add_url_rule("/cans/<int:pk>", view_func=views.load_can)
# bp.add_url_rule(
#     "/cans/portfolio/<int:portfolio_id>", view_func=views.get_portfolio_cans
# )

# can-fiscal-year
# bp.add_url_rule("/can-fiscal-year", view_func=views.all_can_fiscal_years)
# bp.add_url_rule(
#     "/can-fiscal-year/<int:can_id>/<int:year>", view_func=views.get_can_fiscal_year
# )

# budget-line-items
# bp.add_url_rule("/budget-line-items", view_func=views.all_budget_line_items)
# bp.add_url_rule(
#     "/budget-line-items/<int:can_id>/<int:fiscal_year>",
#     view_func=views.get_budget_line_items_by_can_and_fiscal_year,
# )
