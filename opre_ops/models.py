from django.db import models

class Agency(models.Model):
    name = models.CharField()
    nickname = models.CharField()

