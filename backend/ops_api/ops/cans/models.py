from django.db import models

from ops_api.ops.models import Person
from ops_api.ops.portfolios.models import Portfolio


class CAN(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    class ArrangementTypes(models.TextChoices):
        OPRE_APPROPRIATION = "OPRE Appropriation"
        COST_SHARE = "Cost Share"
        IAA = "IAA"
        IDDA = "IDDA"
        MOU = "MOU"

    number = models.CharField(max_length=30)
    description = models.CharField(max_length=100)
    purpose = models.TextField(default="", blank=True)
    nickname = models.CharField(max_length=30)
    arrangement_type = models.CharField(max_length=30, choices=ArrangementTypes.choices)
    funding_source = models.ManyToManyField("FundingSource")
    authorizer = models.ForeignKey(
        "FundingPartner", on_delete=models.PROTECT, related_name="authorizers"
    )
    portfolio = models.ForeignKey(
        Portfolio, on_delete=models.PROTECT, related_name="cans", null=True
    )

    class Meta:
        verbose_name_plural = "CANs"


class FundingPartner(models.Model):
    """
    From: https://docs.google.com/spreadsheets/d/18FP-ZDnvjtKakj0DDGL9lLXPry8xkqNt/

    > Instead of ""Source,"" consider ""Funding Source""
        Instead of ""Agency,"" consider ""Funding Partner""
    """

    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    class Meta:
        db_table = "ops_funding_partner"

    def __str__(self):
        return self.name


class FundingSource(models.Model):
    """
    See docstring for FundingPartner.
    """

    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    class Meta:
        db_table = "ops_funding_source"

    def __str__(self):
        return self.name


class CANFiscalYear(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant financial
    information by fiscal year for a given CAN
    """

    can = models.ForeignKey(CAN, on_delete=models.PROTECT)
    fiscal_year = models.IntegerField()
    total_fiscal_year_funding = models.DecimalField(max_digits=12, decimal_places=2)
    potential_additional_funding = models.DecimalField(max_digits=12, decimal_places=2)
    can_lead = models.ManyToManyField(Person)
    notes = models.TextField(default="", blank=True)

    class Meta:
        unique_together = (
            "can",
            "fiscal_year",
        )
        verbose_name_plural = "CANs (fiscal year)"
        db_table = "ops_can_fiscal_year"


class Agreement(models.Model):

    name = models.TextField()
    agreement_type = models.ForeignKey("AgreementType", on_delete=models.PROTECT)
    cans = models.ManyToManyField(CAN, related_name="agreements")
    owning_portfolio = models.ForeignKey(Portfolio, on_delete=models.PROTECT)


class AgreementType(models.Model):
    class AgreementTypeChoices(models.TextChoices):
        CONTRACT = "Contract"
        GRANT = "Grant"
        DIRECT_ALLOCATION = "Direct Allocation"
        IAA = "IAA"
        MISC = "Miscellaneous"

    agreement_type = models.CharField(
        max_length=100, choices=AgreementTypeChoices.choices
    )

    class Meta:
        db_table = "ops_agreement_type"


class BudgetLineItem(models.Model):
    name = models.TextField()
    fiscal_year = models.IntegerField()
    agreement = models.ForeignKey(Agreement, on_delete=models.PROTECT)
    can = models.ForeignKey(CAN, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.ForeignKey("BudgetLineItemStatus", on_delete=models.PROTECT)

    class Meta:
        db_table = "ops_budget_line_item"


class BudgetLineItemStatus(models.Model):
    class BudgetLineItemStatusChoices(models.TextChoices):
        PLANNED = "Planned"
        OBLIGATED = "Obligated"
        CLOSED = "Closed"

    status = models.CharField(
        max_length=100, choices=BudgetLineItemStatusChoices.choices
    )

    class Meta:
        db_table = "ops_budget_line_item_status"
