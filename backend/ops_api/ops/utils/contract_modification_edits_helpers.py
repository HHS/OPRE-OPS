"""Collapsing a contract modification's edit rows into what changed (OPS-6513).

Kept free of service imports so both the edit service and the award history service can use it
(the award history module is imported by the edit service).
"""


def edit_target(edit) -> tuple:
    """What an edit changes: a Services Component, the agreement (a COR change), or a budget line."""
    # Services Component rows have no budget line, so they're keyed by SC instead; otherwise two
    # SC adds would collapse into one (OPS-6440).
    if edit.services_component_id is not None:
        return ("sc", edit.services_component_id)
    if edit.budget_line_item_id is None:
        # Agreement-level edits, e.g. a COR change (OPS-3153)
        return ("agreement", edit.agreement_id)
    return ("bli", edit.budget_line_item_id)


def net_mod_edits(edits) -> list[tuple]:
    """Collapse a mod's edits, oldest first, to one ``(first, latest)`` pair per (target, field).

    A mod collects edits from every request that joined it, plus superseded rows, so the same
    field can appear more than once. Its net change runs from the first row's From to the latest
    row's To. A deleted target shows only its delete, whose From is the target's first recorded
    amount. Changes that net to nothing are dropped. Returns ORM rows as is; callers build the
    display values from the pair, so nothing here touches the session.
    """
    pairs: dict[tuple, list] = {}
    deleted = set()
    for edit in edits:
        target = edit_target(edit)
        if edit.field == "delete":
            deleted.add(target)
        key = (target, edit.field)
        if key in pairs:
            pairs[key][1] = edit
            # re-insert so the pair sorts by its latest occurrence
            pairs[key] = pairs.pop(key)
        else:
            pairs[key] = [edit, edit]

    result = []
    for (target, field), (first, latest) in pairs.items():
        if target in deleted and field != "delete":
            continue
        if field == "delete":
            amount = pairs.get((target, "amount"))
            if amount is not None:
                first = amount[0]
        elif first.old_value == latest.new_value:
            continue
        result.append((first, latest))
    return result
