from behave import *
from data_tools.src.pipeline_data_from_excel.load_cans_business_rules import LoadCANsBusinessRules


@when(
    "the column CAN contains a string: a number followed by an optional description in parenthesis"
)
def step_impl(context):
    ...


@then(
    "a CAN should be created with CAN.number = {number} and CAN.description = {description}"
)
def step_impl(context, number, description):
    result = LoadCANsBusinessRules.apply_business_rules(context.response)

    # Behave makes None in the Examples a string
    description = description if description != "None" else ""

    assert any(
        can.number == number and can.description == description for can in result
    )
