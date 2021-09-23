from django.contrib import admin
from django.db import models


class Agency(models.Model):
    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "agencies"

    def __str__(self):
        return self.name


class Role(models.Model):
    name = models.CharField(max_length=100, verbose_name="Role Name")
    def __str__(self):
        return self.name


class Person(models.Model):
    DIVISIONS= [('DCFD', 'DCFD'), ('DDI','DDI'), ('DEI','DEI'),
                ('DFS','DFS'), ('OD','OD')]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    roles = models.ManyToManyField(Role)
    division = models.CharField(max_length=5, choices=DIVISIONS)

    class Meta:
        verbose_name_plural = "People"

    def display_name(self):
        return self.first_name + " " + self.last_name
    display_name.short_description = "Full name"
    full_name = property(display_name)

    def __str__(self):
        return self.full_name


class CANInfo(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    The CANInfo model contains all the relevant
    descriptive information about a given CAN
    """

    ARRANGEMENT_TYPES = [('OPRE Appropriation', 'OPRE Appropriation'), ('Cost Share', 'Cost Share'), 
                        ('IAA', 'IAA'), ('IDDA', 'IDDA'), ('MOU', 'MOU')]

    number = models.CharField(max_length=30)
    description = models.CharField(max_length=100)
    purpose = models.TextField(default="", blank=True)
    nickname = models.CharField(max_length=30)
    arrangement_type = models.CharField(max_length=30, choices=ARRANGEMENT_TYPES)
    source = models.ManyToManyField(Agency)
    authorizer = models.ForeignKey(Agency, on_delete=models.PROTECT, related_name="authorizer")

    class Meta:
        verbose_name_plural = "CANs Info"


class CANAmount(models.Model):
    """
    A CAN is a Common Accounting Number, which is
    used to track money coming into OPRE

    The CANAmount model contains all the relevant financial
    information by fiscal year for a given CAN
    """
    can = models.ForeignKey(CANInfo, on_delete=models.PROTECT)
    fiscal_year = models.DecimalField(max_digits=4, decimal_places=0)
    amount_available = models.DecimalField(max_digits=12, decimal_places=2)
    amount_budgeted = models.DecimalField(max_digits=12, decimal_places=2)
    additional_amount_anticipated = models.DecimalField(max_digits=12, decimal_places=2)
    team_leader = models.ForeignKey(Person, on_delete=models.PROTECT, 
                                    limit_choices_to={"roles__name": "Team Leader"})
    notes = models.TextField(default="", blank=True)

    class Meta:
        unique_together = ('can', 'fiscal_year',)
        verbose_name_plural = "CANs"
