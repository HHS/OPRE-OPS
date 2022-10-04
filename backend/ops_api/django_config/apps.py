from django.apps import AppConfig

from ops_api.ops.contexts.application_context import ApplicationContext, DeployedContext


class OpsSiteConfig(AppConfig):

    default_auto_field = "django.db.models.BigAutoField"
    name = "ops_api.ops"
    ApplicationContext.register_context(DeployedContext)