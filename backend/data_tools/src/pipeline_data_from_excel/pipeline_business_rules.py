from abc import ABC
from typing import List, Optional, TypeVar

SourceEntity = TypeVar("SourceTable")
DestinationEntity = TypeVar("DestinationEntity")


class PipelineBusinessRules(ABC):
    @staticmethod
    def apply_business_rules(
        data: List[SourceEntity],
        existing_data: Optional[List[DestinationEntity]] = [],
    ) -> List[DestinationEntity]:
        ...
