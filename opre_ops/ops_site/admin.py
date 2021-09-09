
from django.contrib import admin
from ops_site.models import Agency
from ops_site.models import Role
from ops_site.models import Person


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ("name", "nickname")

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("display_name",)

    def display_name(self):
        return "{} {}".format(self.first_name, self.last_name)
