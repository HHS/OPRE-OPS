from django.db import models

from opre_ops.ops_site.cans.models import CommonAccountingNumber


class Portfolio(models.Model):
    """
    A Portfolio is ___
    """
    PORTFOLIO_STATUS = [
        ("In-Process", "In-Process"),
        ("Not-Started", "Not-Started"),
        ("Sandbox", "Sandbox"),
    ]

    name = models.CharField(max_length=120)
    description = models.TextField(default="", blank=True)
    status = models.CharField(max_length=30, choices=PORTFOLIO_STATUS)
    cans = models.ManyToManyField(CommonAccountingNumber)
    current_fiscal_year_funding = models.DecimalField(max_digits=12,
                                                      decimal_places=2)

    def __str__(self):
        return self.name
