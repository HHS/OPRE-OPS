from marshmallow import Schema, ValidationError, fields, validates


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
    # load_default=None (not a dict literal) so that when the key is omitted, Marshmallow
    # doesn't bypass the nested schema by returning a raw default. The orchestrator
    # normalizes None → {} via `payload.get(...) or {}`, so an absent key is still a no-op.
    services_components = fields.Nested(_ServicesComponentMutationsSchema, load_default=None)
    budget_line_items = fields.Nested(_BudgetLineItemMutationsSchema, load_default=None)

    @validates("agreement")
    def _reject_nested_collections(self, value, **kwargs):
        """Reject nested SC / BLI arrays in the agreement section.

        Those collections belong in the bundle's top-level ``services_components`` /
        ``budget_line_items`` keys, where the orchestrator can apply create/update/delete
        atomically. Silently stripping them would hide client bugs.
        """
        if not value:
            return
        nested = [k for k in ("budget_line_items", "services_components") if k in value]
        if nested:
            raise ValidationError(
                f"{nested} must be sent at the top level of the bundle, not nested under 'agreement'."
            )
