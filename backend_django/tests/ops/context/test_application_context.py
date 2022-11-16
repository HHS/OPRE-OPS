from ops_api.ops.contexts.application_context import ApplicationContext
from ops_api.ops.contexts.application_context import TestContext


def test_application_context_register():
    ApplicationContext.register_context(TestContext)
    assert ApplicationContext.get_context().get_name() == "TestContext"


def test_test_context_get_name():
    assert TestContext.get_name() == "TestContext"


def test_context_auth_library():
    assert TestContext.auth_library() is not None
