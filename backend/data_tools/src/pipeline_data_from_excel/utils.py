from typing import List


def clean_rows(rows: List[List[str]]):
    non_empty_data_rows = []
    for row in rows:
        if row:
            for cell in row:
                if cell:
                    non_empty_data_rows.append(row)
                    break

    return non_empty_data_rows
