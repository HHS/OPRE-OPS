from typing import Any

from sqlalchemy import Column, Select


class QueryHelper:
    def __init__(self, stmt: Select[Any]):
        self.stmt = stmt

    def add_search(self, column: Column, search_term: str) -> Select[Any]:
        self.stmt = self.stmt.where(column.ilike(f"%{search_term}%"))

    def add_column_equals(self, column: Column, value: str) -> Select[Any]:
        self.stmt = self.stmt.where(column == value)

    def get_stmt(self):
        return self.stmt
