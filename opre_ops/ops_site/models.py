from django.contrib import admin
from django.db import models

class Agency(models.Model):
    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "agencies"


class Role(models.Model):
    name = models.CharField(max_length=100, verbose_name="Role Name")
    def __str__(self):
        return self.name


DIVSIONS = [("1","DCFD"), ("2", "DDI"), ("3", "DEI"), ("4", "DFS"), ("5", "OD")]
class Person(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    roles = models.ManyToManyField(Role)
    division = models.CharField(max_length=5, choices=DIVSIONS)

    class Meta:
        verbose_name_plural = "People"

    def display_name(self):
        return self.first_name + " " + self.last_name
    display_name.short_description = "Full name"
    
    full_name = property(display_name)


ARRANGEMENT_TYPES = [("1", "OPRE Appropriation"), ("2", "Cost Share"), ("3", "IAA"), 
                    ("4", "IDDA"), ("5", "MOU")]
class CANInfo(models.Model):
    number = models.CharField(max_length=30)
    description = models.CharField(max_length=100)
    nickname = models.CharField(max_length=30)
    purpose = models.TextField()
    arrangement_type = models.CharField(max_length=30, choices=ARRANGEMENT_TYPES)
    source = models.ManyToManyField(Agency)
    authorizer = models.ForeignKey(Agency, on_delete=models.PROTECT, related_name="authorizer")
