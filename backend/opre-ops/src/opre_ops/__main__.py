"""Command-line interface."""
import click


@click.command()
@click.version_option()
def main() -> None:
    """OPRE-OPS."""


if __name__ == "__main__":
    main(prog_name="opre-ops")  # pragma: no cover
