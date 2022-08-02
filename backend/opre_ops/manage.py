#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    # Default to running with cloud.gov settings for fail-safe; allow override to use local settings.
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "opre_ops.django_config.settings.cloudgov")

    print('PAK::PYTHONPATH2')
    print(sys.path)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
