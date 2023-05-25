from typing import Any, cast

from sqlalchemy import ColumnElement, Select, and_
from sqlalchemy.orm import InstrumentedAttribute


class QueryHelper:
    def __init__(self, stmt: Select[Any]):
        self.stmt = stmt
        self.where_clauses = []

    def add_search(self, column: InstrumentedAttribute, search_term: str):
        self.where_clauses.append(column.ilike(f"%{search_term}%"))

    def add_column_equals(self, column: InstrumentedAttribute, value: str):
        self.where_clauses.append(column == value)

    def return_none(self):
        self.where_clauses.append(cast(ColumnElement, False))

    def get_stmt(self):
        if not self.where_clauses:
            ret_stmt = self.stmt
        elif len(self.where_clauses) == 1:
            ret_stmt =  self.stmt.where(*self.where_clauses)
        else:
            ret_stmt = self.stmt.where(and_(*self.where_clauses))

        return ret_stmt
