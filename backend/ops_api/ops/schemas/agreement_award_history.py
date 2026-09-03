"""Schema for the Award & Modification History endpoint."""

from marshmallow import Schema, fields

from models.vendors import VendorType


class AgreementAwardHistoryRecordSchema(Schema):
    """One flat award/modification record for the Award & Modifications tab.

    Fields that have no data are serialized as ``null``; the frontend applies its
    ``NO_DATA`` ("TBD") fallback at render time, matching the rest of the app.
    """

    fiscal_year_label = fields.String(required=True)
    award_date = fields.Date(allow_none=True)
    award_amount = fields.Decimal(places=2, as_string=True, allow_none=True)
    contract_total = fields.Decimal(places=2, as_string=True, allow_none=True)
    contract_number = fields.String(allow_none=True)
    # "Base" for the initial award, otherwise the AgreementMod number (e.g. "Mod 1").
    modification_number = fields.String(allow_none=True)
    requisition_approval_date = fields.Date(allow_none=True)
    requisition_number = fields.String(allow_none=True)
    vendor_name = fields.String(allow_none=True)
    vendor_unique_entity_id = fields.String(allow_none=True)
    vendor_type = fields.Enum(VendorType, allow_none=True)
    purchase_order_number = fields.String(allow_none=True)
    task_order_number = fields.String(allow_none=True)
