import marshmallow


class List(marshmallow.fields.List):
    """
    Custom Marshmallow List field that handles query parameters.

    This is necessary because the default Marshmallow List field does not handle query parameters correctly.
    """

    def _deserialize(self, value, attr, data, **kwargs):
        if isinstance(data, dict) and hasattr(data, "getlist"):
            value = data.getlist(attr)
        return super()._deserialize(value, attr, data, **kwargs)
