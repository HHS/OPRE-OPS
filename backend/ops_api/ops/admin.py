from django.contrib import admin

from ops_api.ops.cans.models import CAN
from ops_api.ops.cans.models import CANFiscalYear
from ops_api.ops.cans.models import Contract
from ops_api.ops.cans.models import ContractLineItem
from ops_api.ops.cans.models import FundingPartner
from ops_api.ops.models import Person
from ops_api.ops.models import Role
from ops_api.ops.users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email")


@admin.register(FundingPartner)
class FundingPartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "nickname")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("display_name", "show_roles", "division")

    def show_roles(self, obj):
        return ", ".join([role.name for role in obj.roles.all()])

    show_roles.short_description = "Roles"


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("name", "funding_sources", "show_research_areas")

    @staticmethod
    def funding_sources(obj):
        return ", ".join([can.number for can in obj.cans.all()])

    def show_research_areas(self, obj):
        return ", ".join(obj.research_areas)

    show_research_areas.short_description = "research areas"


@admin.register(ContractLineItem)
class ContractLineItemAdmin(admin.ModelAdmin):
    list_display = ("show_contract", "name")

    def show_contract(self, obj):
        return obj.contract.name

    show_contract.short_description = "contract"


class CANAmountInline(admin.TabularInline):
    model = CANFiscalYear


@admin.register(CAN)
class CANInfoAdmin(admin.ModelAdmin):
    inlines = [
        CANAmountInline,
    ]

    list_display = ("display_can_name",)

    def display_can_name(self, obj):
        return obj.number + " (" + obj.nickname + ") "

    display_can_name.short_description = "CAN Name"


@admin.register(CANFiscalYear)
class CANFiscalYear(admin.ModelAdmin):
    list_display = (
        "can_display_name",
        "can_description",
        "can_funding_source",
        "can_purpose",
        "fiscal_year",
        "total_fiscal_year_funding",
        "amount_available",
        "additional_amount_anticipated",
        "potential_additional_funding",
        "can_arrangement_type",
        "can_authorizer",
        "display_can_leads",
        "can_division",
        "notes",
    )

    def can_display_name(self, obj):
        return f"{obj.can.number} ({obj.can.nickname}) - {obj.fiscal_year}"

    can_display_name.short_description = "CAN #"

    def can_description(self, obj):
        return obj.can.description

    can_description.short_description = "Description"

    def can_purpose(self, obj):
        return obj.can.purpose

    can_purpose.short_description = "Purpose"

    def can_arrangement_type(self, obj):
        return obj.can.arrangement_type

    can_arrangement_type.short_description = "Arrangement Type"

    def can_funding_source(self, obj):
        return ", ".join([source.name for source in obj.can.funding_source.all()])

    can_funding_source.short_description = "Funding Source"

    def display_can_leads(self, obj):
        return ", ".join([lead.full_name for lead in obj.can_lead.all()])

    display_can_leads.short_description = "CAN Lead"

    @staticmethod
    def can_authorizer(obj):
        return obj.can.authorizer.name

    def can_division(self, obj):
        # only display multiple divisons if leads are in different divisions
        return ", ".join(set([lead.division for lead in obj.can_lead.all()]))

    can_division.short_description = "OPRE Division"
