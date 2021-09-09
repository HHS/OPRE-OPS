from django.contrib import admin
from django.db import models

class Agency(models.Model):
    name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "agencies"

class Role(models.Model):
    name = models.CharField(max_length=100, verbose_name="Role Name")
