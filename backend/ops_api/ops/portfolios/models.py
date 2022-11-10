from django.db import models


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

    def __str__(self):
        return self.name
