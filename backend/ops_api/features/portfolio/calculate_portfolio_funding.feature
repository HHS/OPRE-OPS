Feature: Calculate Portfolio Funding By Research Project

  Scenario: Calculate FY Total Portfolio Budget For All 1-Year CANs
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the FY XXXX Budget vs Spending container.)
    Given a set of CAN data with the current FY 2023
      | CAN | total funding |
      | 1   | $100          |
      | 2   | $150          |
      | 3   | $250          |
    When I calculate the Total Portfolio Budget
    Then the result should be $500.

  Scenario: Calculate FY Total Portfolio Budget With Carry-Over CANs
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the FY XXXX Budget vs Spending container.)
    # assuming CAN 2 is re-used over the 5 fiscal years
    Given a set of CAN data with the current FY 2023
      | CAN | appropriation term | fiscal year | total funding |
      | 1   | 1                  | 2023        | $100          |
      | 2   | 5                  | 2022        | $150          |
      | 2   | 5                  | 2021        | $200          |
    When I calculate the Total Portfolio Budget
    Then the result should be $450.

  Scenario: Calculate FY Total Spending
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the FY XXXX Budget vs Spending container.)
    Given a set of CAN and BLI data with the current FY 2023
      | CAN | BLI | BLI amount | BLI status   |
      | 1   | 1   | $100       | Obligated    |
      | 1   | 2   | $125       | In-Execution |
      | 1   | 3   | $150       | Planned      |
    When I calculate the Total Spending
    Then the result should be $375.

  Scenario: Calculate Remaining Budget
  (Displayed on the "Projects and Spending" tab on the Portfolio details
  page in the FY XXXX Budget vs Spending container.)
    Given a Total Portfolio Budget of $100 and a Total Spending of $50
    When I calculate the Remaining Budget
    Then the result should be $50.
