from django.db import models

from opre_ops.ops_site.models import Person
from opre_ops.ops_site.portfolios.models import Portfolio


class FundingPartner(models.Model):
    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class CommonAccountingNumber(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant
    descriptive information about a given CAN
    """

    ARRANGEMENT_TYPES = [
        ("OPRE Appropriation", "OPRE Appropriation"),
        ("Cost Share", "Cost Share"),
        ("IAA", "IAA"),
        ("IDDA", "IDDA"),
        ("MOU", "MOU"),
    ]

    number = models.CharField(max_length=30)
    description = models.CharField(max_length=100)
    purpose = models.TextField(default="", blank=True)
    nickname = models.CharField(max_length=30)
    arrangement_type = models.CharField(max_length=30, choices=ARRANGEMENT_TYPES)
    funding_source = models.ManyToManyField(FundingPartner)
    authorizer = models.ForeignKey(
        FundingPartner, on_delete=models.PROTECT, related_name="authorizer"
    )
    portfolio = models.ForeignKey(
        Portfolio, on_delete=models.PROTECT, related_name="cans", null=True
    )

    class Meta:
        verbose_name_plural = "CANs"


class CANFiscalYear(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    This model contains all the relevant financial
    information by fiscal year for a given CAN
    """

    can = models.ForeignKey(CommonAccountingNumber, on_delete=models.PROTECT)
    fiscal_year = models.IntegerField()
    amount_available = models.DecimalField(max_digits=12, decimal_places=2)
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

    @property
    def additional_amount_anticipated(self):
        return self.total_fiscal_year_funding - self.amount_available


class Contract(models.Model):
    cans = models.ManyToManyField(CommonAccountingNumber, related_name="contracts")
    name = models.TextField()

    @property
    def research_areas(self):
        return [can.nickname for can in self.cans.all()]


class ContractLineItem(models.Model):
    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="line_items"
    )
    name = models.TextField()


class ContractLineItemFiscalYear(models.Model):
    line_item = models.ForeignKey(
        ContractLineItem, on_delete=models.CASCADE, related_name="fiscal_years"
    )
    fiscal_year = models.IntegerField()

    @property
    def contract(self):
        return self.line_item.contract

    @property
    def name(self):
        return self.line_item.name


class ContractLineItemFiscalYearPerCAN(models.Model):
    fiscal_year = models.ForeignKey(
        ContractLineItemFiscalYear, on_delete=models.CASCADE, related_name="cans"
    )
    can = models.ForeignKey(
        CommonAccountingNumber, on_delete=models.PROTECT, related_name="line_items_fy"
    )
    funding = models.DecimalField(max_digits=12, decimal_places=2)

    @property
    def contract(self):
        return self.fiscal_year.contract

    @property
    def name(self):
        return self.fiscal_year.name
