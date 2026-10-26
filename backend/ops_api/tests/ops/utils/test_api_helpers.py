import pytest

from ops_api.ops.utils.api_helpers import validate_host_header_prefix


@pytest.mark.parametrize(
    "prefix",
    ["localhost", "opre-ops-dev-app-backend.", "opre-ops-pr12-app-backend."],
)
def test_validate_host_header_prefix_accepts_localhost_and_delimited_prefixes(prefix):
    validate_host_header_prefix(prefix)


def test_validate_host_header_prefix_rejects_undelimited_deployed_prefix():
    """Without the trailing ".", check_csrf's startswith would let PR 12's prefix match PR 123's host."""
    with pytest.raises(ValueError, match="must end with"):
        validate_host_header_prefix("opre-ops-pr12")
