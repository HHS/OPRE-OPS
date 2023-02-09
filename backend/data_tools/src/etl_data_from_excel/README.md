### How to run

```
luigi --module data_tools.src.etl_data_from_excel.load_research_projects LoadResearchProjects --local-scheduler --run-date `date -u +%Y-%m-%dT%H%M%S`
```
