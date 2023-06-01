Feature: Calculate the number of active Agreements for a given Portfolio and FY.
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the FY XXXX Agreements container.)

  N.B. The term "Managed CAN" below indicates that the CAN is managed by the given Portfolio.
  The assumption here is that the Portfolio Details page should only include CANs that it manages.
  Relationship is: 1 Managed CAN has only 1 Portfolio it belongs to.

  Scenario: CANs managed by Portfolio exist and are associated with Agreements.
    Given a set of data below with the current FY 2023
      | Portfolio | Managed CAN | FY   | Agreement |
      | 1         | 1           | 2023 | 1,2,3     |
      | 1         | 2           | 2023 | 1,2       |
      | 1         | 3           | 2023 | 1         |
      | 1         | 4           | 2023 | 1         |

    When I calculate the number of active Agreements for a given Portfolio and FY 2023
    Then the result should be 3.

  Scenario: Exclude Agreements with CANs in previous FY
    Given a set of data below with the current FY 2023
      | Portfolio | Managed CAN | FY   | Agreement |
      | 1         | 1           | 2022 | 1,2,3     |
      | 1         | 2           | 2021 | 1,2       |
      | 1         | 3           | 2020 | 1         |
      | 1         | 4           | 2019 | 1         |
    When I calculate the number of active Agreements for a given Portfolio and FY 2023
    Then the result should be 0.

  Scenario: Exclude Agreements with CANs in other Portfolios
    Given a set of data below with the current FY 2023
      | Portfolio | Managed CAN | FY   | Agreement |
      | 1         | 1           | 2023 | 1,2       |
      | 2         | 2           | 2023 | 1,2       |
      | 3         | 3           | 2023 | 1         |
      | 4         | 4           | 2023 | 1         |
    When I calculate the number of active Agreements for Portfolio #1 and FY 2023
    Then the result should be 2.

  Scenario: Count Planned Agreements
    Given a set of data below with the current FY 2023
      | Portfolio | Managed CAN | FY   | Agreement | Agreement Status |
      | 1         | 1           | 2023 | 1         | Planned          |
      | 1         | 2           | 2023 | 1         | Planned          |
      | 1         | 3           | 2023 | 1         | Planned          |
      | 1         | 4           | 2023 | 2         | Executing        |
      | 1         | 5           | 2023 | 3         | Obligated        |
    When I calculate the number of active Agreements for Portfolio #1 and FY 2023
    Then the result should be 2.
