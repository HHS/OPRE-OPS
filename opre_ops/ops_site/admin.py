
from django.contrib import admin
from ops_site.models import Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name",)
