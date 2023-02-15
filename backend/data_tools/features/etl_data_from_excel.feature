Feature: Load new Research Projects and Agreements from Sheila's Excel file: REDACTED-FY22_Budget_Summary-10-12-22.xlsm

  Scenario: Create a new ResearchProject
    Given a record from the spreadsheet
      | CAN                      | Project Title | CIG Name    | CIG Type |
      | A000000                  | Placeholder   | Placeholder |          |
      | GXXXXXX                  | OPRE          | Agreement 0 | do       |
      | GXXXXXX                  | Project 1     | Agreement 1 | do       |
      | GXXXXXX (CC - SB - 5 YR) | Project 2     | Agreement 2 | iaa      |
      | GXXXXXX                  | Project 1     | Agreement 1 | do       |
    When the column Project Title contains a non-empty string
    And the column Project Title != Placeholder and Project Title != OPRE
    And there is not an existing ResearchProject with this Project Title
    Then a new ResearchProject should be created with ResearchProject.title = Project Title.

  Scenario Outline: Create a new CAN
    Given a record from the spreadsheet
      | CAN                         | Project Title | CIG Name    | CIG Type |
      | A000000                     | Placeholder   | Placeholder |          |
      | GXXXXXX                     | OPRE          | Agreement 0 | do       |
      | GXXXXXY (CC - SB - 5 YR)    | Project 1     | Agreement 1 | do       |
      | GXXXXXZ(  CC - SB - 5 YR  ) | Project 1     | Agreement 1 | do       |
    When the column CAN contains a string: a number followed by an optional description in parenthesis
    Then a CAN should be created with CAN.number = <number> and CAN.description = <description>
    Examples:
      | number  | description    |
      | GXXXXXX | None           |
      | GXXXXXY | CC - SB - 5 YR |
      | GXXXXXZ | CC - SB - 5 YR |


#  Scenario: Assign a CAN to ResearchProject
#    Given a record from the spreadsheet
#    When the column CAN contains a string
#    And the column Project Title contains a string
#    But the column Project Title != Placeholder and Project Title != OPRE
#    Then the associated CAN should be managed by the associated Research Project.
#
#  Scenario: Create a new Agreement
#    Given a record from the spreadsheet
#    When the column CIG Name contains a string
#    But the column CIG Name != Placeholder
#    Then an Agreement should be created with name = CIG Name.
#
#  Scenario: Assign a CAN to an Agreement
#    Given a record from the spreadsheet
#    When the column CIG Name contains a string
#    And the column CAN contains a string
#    Then the associated CAN should be associated with the associated Agreement.
#
#  Scenario Outline: Assign Agreement Type
#    Given a record from the spreadsheet
#    When the column CIG Name contains a string
#    And the column CIG Type contains a string <type>
#    Then the Agreement should be assigned with type <agreement type>.
#
#    Examples:
#      | type     | agreement type    |
#      | do       | Direct Obligation |
#      | iaa      | IAA               |
#      | contract | Contract          |
#      | grants   | Grant             |
#
#  Scenario Outline: Create ResearchProject with correct Portfolio assignment
#    Given a record from the spreadsheet
#    When the column CAN contains the <text> in parenthesis
#    Then a ResearchProject should be created assigned to a Portfolio with <portfolio name>.
#
#    Examples: Child Care
#      | text           | portfolio name |
#      | CC-OPRE-Sal    | Child Care     |
#      | CC             | Child Care     |
#      | CC-COVID       | Child Care     |
#      | CCE            | Child Care     |
#      | CC - SB - 5 YR | Child Care     |
#      | CC - 5 YR      | Child Care     |
#
#    Examples: Head Start
#      | text         | portfolio name |
#      | HS-TA        | Head Start     |
#      | HS           | Head Start     |
#      | HS Admin Res | Head Start     |
#      | HS-5 YR      | Head Start     |
#
#    Examples: Welfare Research
#      | text        | portfolio name   |
#      | WR          | Welfare Research |
#      | WR-OPRE Sal | Welfare Research |
#      | OFA-WR      | Welfare Research |
#
#    Examples: Healthy Marriage & Responsible Fatherhood
#      | text      | portfolio name                            |
#      | OPRE-HMRF | Healthy Marriage & Responsible Fatherhood |
#
#    Examples: Home Visiting
#      | text             | portfolio name |
#      | MIECHV COV HV TA | Home Visiting  |
#      | MHV-T-TA22       | Home Visiting  |
#      | COV - HV - R&E   | Home Visiting  |
#      | MIECHV COV TA    | Home Visiting  |
#      | HV-OAS           | Home Visiting  |
#      | MHV-TA22         | Home Visiting  |
#      | HV - Sal         | Home Visiting  |
#      | MHV-T-TA21       | Home Visiting  |
#      | MHV-22           | Home Visiting  |
#      | MHV-G17          | Home Visiting  |
#
#    Examples: Social Science Research Demonstration
#      | text | portfolio name                        |
#      | SSRD | Social Science Research Demonstration |
#
#    Examples: Miscellaneous (no obvious mapping to Portfolio)
#      | text                          | portfolio name |
#      | G990596 (SRAE Disc)           | ?              |
#      | G99FF22 (OPRE-PSSF-D - 5 YR)  | ?              |
#      | G99RD22 (R&D-5 YR)            | ?              |
#      | G994426                       | ?              |
#      | G99BR22 (DiaperBk R&D - 5 YR) | ?              |
#      | G990201 (HPOG - Res)          | ?              |
#      | A000000                       | ?              |
#      | G99SS21 (PREP)                | ?              |
#      | G990205 (HPOG Sal)            | ?              |
#      | G995514 (OPER)                | ?              |
#      | G99SS20 (PREP)                | ?              |
#      | G994417 (ILP-TA)              | ?              |
#      | G99CD22 (OPRE CA Disc Resrch) | ?              |
#      | G990136 (OPRE-ASPE IDDA)      | ?              |
#      | G99SS22 (PREP)                | ?              |
#      | G99SS13 (ACYF)                | ?              |
#      | G990125 (NICHD IDDA)          | ?              |
#      | G99SS18 (PREP)                | ?              |
#      | G996490 (Recovery Coaches)    | ?              |
#      | G994103 (IV-E)                | ?              |
#      | G994150 (CA-Disc)             | ?              |
#      | G99SS17 (PREP)                | ?              |


#########################################
# Questions
# 1. Should the records with Project Title = Placeholder be ignored?
# 2. Are the records with Project Title = OPRE the same ResearchProject or is OPRE a placeholder for a number of ResearchProjects?
# 3. For Project Title = Acquisition Services, it seems like there are CANs in multiple Portfolios: can a ResearchProject belong
# to more than one Portfolio or should multiple Portfolios contain a ResearchProject with title = Acquisition Services
