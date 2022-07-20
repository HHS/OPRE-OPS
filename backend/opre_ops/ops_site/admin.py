from django.contrib import admin

from ops_site.models import (
    CANFiscalYear,
    CommonAccountingNumber,
    Contract,
    ContractLineItem,
    FundingPartner,
    Person,
    Role,
)


# Here just for reference. Shows how to traverse relationships
def print_a_can(can_number, fiscal_year):
    can = CommonAccountingNumber.objects.filter(number=can_number).first()

    if can:
        print()
        print("===============")
        print(f"CAN ID: {can.number} ({can.id})")
        print(f"   Description: {can.description}")
        print(f"   Purpose:     {can.purpose}")
        print(f"   Nickname:    {can.nickname}")
        print(f"   Arrangement: {can.arrangement_type}")
        print(f"   Authorizer:  {can.authorizer}")
        print()
        print("Funding sources:")
        for fs in can.funding_source.all():
            print(f"   {fs}")

        print()

        canfy = can.info_for_fiscal_year(fiscal_year)

        print(f"Fiscal year: {fiscal_year}")
        print("   Leads:")
        for person in canfy.can_lead.all():
            print(f"      {person.display_name()} ({person.division})")
            for role in person.roles.all():
                print(f"        - {role}")

        print()
        print(f"   Total funding:        ${canfy.total_fiscal_year_funding:,.2f}")
        print(f"   Amount available:     ${canfy.amount_available:,.2f}")
        print(f"   Potential additional: ${canfy.potential_additional_funding:,.2f}")
        print(f"   Notes: {canfy.notes}")

        print()

        print("Contracts:")
        first = True
        for contract in can.contracts_for_fiscal_year(fiscal_year):
            if not first:
                print("---------------")
            first = False

            print(f"   Name:             {contract.name}")
            print(
                f"   CAN Contribution: ${contract.contribution_by_can_for_fy(can, fiscal_year):,.2f}"
            )
            print()

            print("   Other funding sources:")
            for other_can in contract.cans.exclude(id=can.id):
                print(f"      {other_can.number} ({other_can.nickname})")

            print()
            print("   Line items (CAN contributions):")

            for line_item in contract.line_items_for_fy_and_can(fiscal_year, can):
                print(f"     - {line_item.name:<20}${line_item.funding:,.2f}")

        print("===============")
        print()


# print_a_can("G994426", 2021)


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

    def funding_sources(self, obj):
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


@admin.register(CommonAccountingNumber)
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

    def can_authorizer(self, obj):
        return obj.can.authorizer.name

    def can_division(self, obj):
        # only display multiple divisons if leads are in different divisions
        return ", ".join(set([lead.division for lead in obj.can_lead.all()]))

    can_division.short_description = "OPRE Division"
