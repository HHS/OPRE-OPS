from behave import *
from data_tools.src.pipeline_data_from_excel.load_research_projects_business_rules import (
    LoadResearchProjectsBusinessRules,
)
from models import ResearchProject
from models.etl import AllBudgetCurrent


@given("a record from the spreadsheet")
def step_impl(context):
    context.response = []
    for row in context.table:
        context.response.append(
            AllBudgetCurrent(
                CAN=row["CAN"],
                Project_Title=row["Project Title"],
                CIG_Name=row["CIG Name"],
                CIG_Type=row["CIG Type"],
            )
        )


@when("the column Project Title contains a non-empty string")
def step_impl(context):
    context.response = [
        record for record in context.response if len(record.Project_Title) > 0
    ]


@when("there is not an existing ResearchProject with this Project Title")
def step_impl(context):
    ...


@when("the column Project Title != Placeholder and Project Title != OPRE")
def step_impl(context):
    context.response = [
        record
        for record in context.response
        if record.Project_Title not in ["Placeholder", "OPRE"]
    ]


@then(
    "a new ResearchProject should be created with ResearchProject.title = Project Title."
)
def step_impl(context):
    result = LoadResearchProjectsBusinessRules.apply_business_rules(context.response)
    assert len(result) == 2, "should be 2 because there are no ResearchProjects"

    result = LoadResearchProjectsBusinessRules.apply_business_rules(
        context.response, [ResearchProject(title="Project 1")]
    )
    assert (
        len(result) == 1
    ), "should be 1 because there is a ResearchProject with the same title"

    result = LoadResearchProjectsBusinessRules.apply_business_rules(
        context.response, [ResearchProject(title="Project 2")]
    )
    assert (
        len(result) == 1
    ), "should be 1 because there is a ResearchProject with the same title"

    result = LoadResearchProjectsBusinessRules.apply_business_rules(
        context.response,
        [ResearchProject(title="Project 1"), ResearchProject(title="Project 2")],
    )
    assert len(result) == 0, "should be 0 because there are already ResearchProjects"
