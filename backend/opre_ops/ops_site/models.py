from __future__ import annotations

from django.db import models


class Role(models.Model):
    name = models.CharField(max_length=100, verbose_name="Role Name")

    def __str__(self: Role) -> str:
        return self.name


class Person(models.Model):
    DIVISIONS = [
        ("DCFD", "DCFD"),
        ("DDI", "DDI"),
        ("DEI", "DEI"),
        ("DFS", "DFS"),
        ("OD", "OD"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    roles = models.ManyToManyField(Role)
    division = models.CharField(max_length=5, choices=DIVISIONS)

    class Meta:
        verbose_name_plural = "People"

    def display_name(self: Person) -> str:
        return f"{self.first_name} {self.last_name}"

    display_name.short_description = "Full name"
    full_name = property(display_name)

    def __str__(self: Person) -> str:
        return self.full_name
