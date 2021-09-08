
from django.contrib import admin
from ops_site.models import Agency
from ops_site.models import Role


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "nickname")

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)
