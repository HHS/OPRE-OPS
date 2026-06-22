from marshmallow import Schema, fields


class _ServicesComponentMutationsSchema(Schema):
    """Create / update / delete buckets for services components in a bundle."""

    create = fields.List(fields.Dict(), load_default=list)
    update = fields.List(fields.Dict(), load_default=list)
    delete = fields.List(fields.Integer(), load_default=list)


class _BudgetLineItemMutationsSchema(Schema):
    """Create / update / delete buckets for budget line items in a bundle."""

    create = fields.List(fields.Dict(), load_default=list)
    update = fields.List(fields.Dict(), load_default=list)
    delete = fields.List(fields.Integer(), load_default=list)


class AgreementEditBundleRequestSchema(Schema):
    """Top-level shape for ``PATCH /agreements/<id>/edit-bundle``.

    The agreement section is left as a free-form dict because the per-agreement-type
    dataclass schemas (``AGREEMENTS_REQUEST_SCHEMAS``) handle the real validation in
    the orchestrator — keying off the existing agreement's type. Likewise the SC and
    BLI buckets are validated by the service layer that the orchestrator delegates to.

    Any of the four top-level keys can be omitted; an empty bundle is a no-op.
    """

    agreement = fields.Dict(load_default=None)
    services_components = fields.Nested(
        _ServicesComponentMutationsSchema,
        load_default=lambda: {"create": [], "update": [], "delete": []},
    )
    budget_line_items = fields.Nested(
        _BudgetLineItemMutationsSchema,
        load_default=lambda: {"create": [], "update": [], "delete": []},
    )
