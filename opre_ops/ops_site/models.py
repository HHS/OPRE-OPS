from django.db import models

class Agency(models.Model):
    name = models.CharField(max_length=80)
    nickname = models.CharField(max_length=40)
