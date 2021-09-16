
from django.contrib import admin

from ops_site.models import Agency
from ops_site.models import Role
from ops_site.models import Person
from ops_site.models import CANInfo
from ops_site.models import CANAmount


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "nickname")

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("display_name", "show_roles", "division")

    def show_roles(self, obj):
        return ", ".join([role.name for role in obj.roles.all()])
    show_roles.short_description = "Roles"

class CANAmountInline(admin.TabularInline):
    model = CANAmount

@admin.register(CANInfo)
class CANInfoAdmin(admin.ModelAdmin):
    inlines = [
        CANAmountInline,
    ]

    list_display = ("display_can_name",)

    def display_can_name(self, obj):
        return obj.number + " (" + obj.nickname + ") "
    display_can_name.short_description = "CAN Name"
