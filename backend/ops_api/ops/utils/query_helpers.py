from typing import Any, cast

from sqlalchemy import ColumnElement, Select
from sqlalchemy.orm import InstrumentedAttribute


class QueryHelper:
    def __init__(self, stmt: Select[Any]):
        self.stmt = stmt

    def add_search(self, column: InstrumentedAttribute, search_term: str):
        self.stmt = self.stmt.where(column.ilike(f"%{search_term}%"))

    def add_column_equals(self, column: InstrumentedAttribute, value: str):
        self.stmt = self.stmt.where(column == value)

    def return_none(self):
        self.stmt = self.stmt.where(cast(ColumnElement, False))

    def get_stmt(self):
        return self.stmt
