from typing import Any, cast

from sqlalchemy import ColumnElement, Select, and_, or_
from sqlalchemy.orm import InstrumentedAttribute


class QueryHelper:
    def __init__(self, stmt: Select[Any]):
        self.stmt = stmt
        self.where_clauses: list[Any] = []

    def add_search(self, column: InstrumentedAttribute, search_term: str):
        self.where_clauses.append(column.ilike(f"%{search_term}%"))

    def add_column_equals(self, column: InstrumentedAttribute, value: str):
        self.where_clauses.append(column == value)

    def add_column_in_list(self, column: InstrumentedAttribute, values: list[Any]):
        """Add a filter for column matching any value in the provided list (OR logic)."""
        if values:
            self.where_clauses.append(column.in_(values))

    def add_search_list(self, column: InstrumentedAttribute, search_terms: list[str]):
        """Add search filters for multiple terms (AND logic - must match all terms)."""
        for search_term in search_terms:
            if search_term is not None and len(search_term) == 0:
                # Empty string means return no results
                self.return_none()
            elif search_term:
                self.where_clauses.append(column.ilike(f"%{search_term}%"))

    def add_search_list_multi_column(self, columns: list[InstrumentedAttribute], search_terms: list[str]):
        """Add search filters for multiple terms across multiple columns.

        For each search term, at least one related row must match (across any of the columns).
        This allows different search terms to match different related rows.

        Example: searching ["contract", "2023"] across [Agreement.name, Agreement.nick_name] means:
        - At least one agreement must have (name contains "contract" OR nick_name contains "contract") AND
        - At least one agreement (can be different) must have (name contains "2023" OR nick_name contains "2023")

        Note: When used with JOINed tables, this requires using EXISTS subqueries or similar
        to properly support matching different rows for different terms.
        """
        for search_term in search_terms:
            if search_term is not None and len(search_term) == 0:
                # Empty string means return no results
                self.return_none()
            elif search_term:
                # Create OR condition across all columns for this search term
                # When multiple search terms are used, each term creates a separate WHERE condition
                # that gets ANDed together, but each evaluates independently across joined rows
                column_conditions = [column.ilike(f"%{search_term}%") for column in columns]
                self.where_clauses.append(or_(*column_conditions))

    def return_none(self):
        self.where_clauses.append(cast(ColumnElement, False))

    def get_stmt(self):
        if not self.where_clauses:
            ret_stmt = self.stmt
        elif len(self.where_clauses) == 1:
            ret_stmt = self.stmt.where(*self.where_clauses)
        else:
            ret_stmt = self.stmt.where(and_(*self.where_clauses))

        return ret_stmt

    def add_column_in_range(self, min_property_or_column: Any, max_property_or_column: Any, value: Any):
        self.where_clauses.append(and_(value >= min_property_or_column, value <= max_property_or_column))
