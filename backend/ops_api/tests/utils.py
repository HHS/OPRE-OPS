def remove_keys(d: dict, keys: list[str]):
    """
    Recursively remove keys from a dictionary.
    """
    if isinstance(d, dict):
        for key in keys:
            d.pop(key, None)
        for value in d.values():
            remove_keys(value, keys)
    elif isinstance(d, list):
        for item in d:
            remove_keys(item, keys)
