Feature: List Research Projects and their funding for a given Portfolio and FY.
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the Research Projects table.)

  N.B. The term "Managed CAN" below indicates that the CAN is managed by the given Portfolio.
  The assumption here is that the Portfolio Details page should only include CANs that it manages.
  Relationship is: 1 Managed CAN has only 1 Portfolio it belongs to.

  Scenario: There exist Research Projects that have managed CANs that are managed by a Portfolio.
    Given a set of ResearchProject/CAN data below with the current FY 2023
      | Portfolio | Managed RP | FY   | Managed CAN |
      | 1         | 1          | 2023 | 1,2,3       |
      | 1         | 2          | 2023 | 1,2         |
      | 1         | 3          | 2023 | 1           |
      | 1         | 4          | 2023 | 1           |

    When I list the Research Projects for a given Portfolio and FY 2023
    Then the result should be the 4 Research Projects above.

  Scenario: Calculate Research Project total funding for a given FY.
    Given a set of ResearchProject/CAN/Funding data below with the current FY 2023
      | Research Project | Managed CAN | CAN FY | Funding |
      | 1                | 1           | 2023   | $5      |
      | 1                | 2           | 2023   | $7      |
      | 1                | 3           | 2023   | $3      |
      | 1                | 1           | 2022   | $5      |
      | 1                | 2           | 2022   | $5      |
      | 2                | 4           | 2023   | $5      |

    When I calculate the total funding for Research Project 1 in FY 2023
    Then the result should be $15.

  Scenario: Calculate Research Project funding to date.
    Given a set of ResearchProject with dates data below
      | Research Project | RP Origination Date | Managed CAN | CAN Appropriation Date | CAN FY | Funding |
      | 1                | 1/1/2018            | 1           | 1/30/2018              | 2018   | $5      |
      | 1                | 1/1/2018            | 2           | 9/1/2018               | 2018   | $5      |
      | 1                | 1/1/2018            | 3           | 10/1/2017              | 2018   | $5      |
      | 2                | 1/1/2020            | 4           | 10/1/2022              | 2023   | $5      |
      | 2                | 1/1/2020            | 5           | 10/1/2017              | 2018   | $5      |
    When I calculate the funding to date
    Then the result for Research Project #1 should be $10 and #2 should be $5.

  Scenario: Calculate number of CANs funding a Research Project for a given FY.
    Given a set of ResearchProject/CAN/Funding data below with the current FY 2023
      | Research Project | Managed CAN | CAN FY | Funding |
      | 1                | 1           | 2023   | $5      |
      | 1                | 2           | 2023   | $7      |
      | 1                | 3           | 2023   | $3      |
      | 1                | 1           | 2022   | $5      |
      | 1                | 2           | 2022   | $5      |
      | 2                | 4           | 2023   | $5      |
    When I calculate the number of CANs for Portfolio 1 and FY 2023
    Then the result should be 3.

  Scenario: Calculate Agreement type for a Research Project
    Given a set of Agreement data below
      | Research Project | Agreement | Agreement Type    |
      | 1                | 1         | Grant             |
      | 2                | 2         | Contract          |
      | 3                | 3         | IAA               |
      | 4                | 4         | Asst Acq          |
      | 5                | 5         | Direct Obligation |
      | 6                | 6         | Grant             |
      | 6                | 7         | Contract          |
    When I calculate the Agreement Type for a Research Project
    Then the result should 1 - Grant, 2 - Contract, 3 - IAA, 4 - Asst Acq, 5 - Direct Obligation, 6 - Mixed
