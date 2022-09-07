from importlib import import_module

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.core.management.color import no_style
from django.core.management.sql import sql_flush
from django.db import connections, DEFAULT_DB_ALIAS


class Command(BaseCommand):
    help = (
        "Removes ALL DATA from the database, including data added during "
        'migrations. Does not achieve a "fresh install" state.'
    )
    stealth_options = ("reset_sequences", "allow_cascade", "inhibit_post_migrate")

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            "--no-input",
            action="store_false",
            dest="interactive",
            help="Tells Django to NOT prompt the user for input of any kind.",
        )
        parser.add_argument(
            "--database",
            default=DEFAULT_DB_ALIAS,
            help='Nominates a database to flush. Defaults to the "default" database.',
        )
        parser.add_argument(
            "--allow-cascade",
            action="store_true",
            default=False,
            dest="allow_cascade",
            help="Add CASCADE to the TRUNCATE.",
        )

    def handle(self, **options):
        database = options["database"]
        connection = connections[database]
        interactive = options["interactive"]
        allow_cascade = options["allow_cascade"]

        self.style = no_style()

        # Import the 'management' module within each installed app, to register
        # dispatcher events.
        for app_config in apps.get_app_configs():
            try:
                import_module(".management", app_config.name)
            except ImportError:
                pass

        sql_list = sql_flush(
            self.style,
            connection,
            reset_sequences=True,
            allow_cascade=allow_cascade,
        )

        if interactive:
            confirm = input(
                """You have requested a flush of the database.
This will IRREVERSIBLY DESTROY all data currently in the "%s" database,
and return each table to an empty state.
Are you sure you want to do this?

    Type 'yes' to continue, or 'no' to cancel: """
                % connection.settings_dict["NAME"]
            )
        else:
            confirm = "yes"

        if confirm == "yes":
            try:
                connection.ops.execute_sql_flush(sql_list)
            except Exception as exc:
                raise CommandError(
                    "Database %s couldn't be flushed. Possible reasons:\n"
                    "  * The database isn't running or isn't configured correctly.\n"
                    "  * At least one of the expected database tables doesn't exist.\n"
                    "  * The SQL was invalid.\n"
                    "Hint: Look at the output of 'django-admin sqlflush'. "
                    "That's the SQL this command wasn't able to run."
                    % (connection.settings_dict["NAME"],)
                ) from exc

        else:
            self.stdout.write("Flush cancelled.")
