import re
from typing import List

from data_tools.src.pipeline_data_from_excel.pipeline_business_rules import PipelineBusinessRules
from models import *

re_pattern = re.compile(r"(\w+)\s*\(*(.*)\)*")


def extract_can_number_from_can_string(can_string: str) -> str:
    return (
        re_pattern.match(can_string).group(1).strip()
        if re_pattern.match(can_string)
        else None
    )


def extract_can_description_from_can_string(can_string: str) -> str:
    return (
        re_pattern.match(can_string).group(2)[:-1].strip()  # remove the last )
        if re_pattern.match(can_string)
        else None
    )


class LoadCANsBusinessRules(PipelineBusinessRules):
    @staticmethod
    def apply_business_rules(
        data: List[AllBudgetCurrent],
        existing_cans: List[CAN] = [],
    ) -> List[CAN]:
        cans = [
            CAN(
                number=extract_can_number_from_can_string(record.CAN),
                description=extract_can_description_from_can_string(record.CAN),
            )
            for record in data
            if all(
                extract_can_number_from_can_string(record.CAN) != can.number
                for can in existing_cans
            )
        ]
        # Remove dup CAN numbers
        result = []
        can_numbers = set()
        for record in cans:
            if record.number not in can_numbers:
                result.append(record)
                can_numbers.add(record.number)

        return result
