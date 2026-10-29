Feature: Start a Contract Modification for a Modified LOE
  As a COR, I want to send the edits I made on an Awarded agreement, plus any Planned budget
  lines I want to execute, to my Division Director as a Contract Modification, so the award
  documents can be officially updated.

  See: (Start a Contract Modification for a Modified LOE)[https://github.com/HHS/OPRE-OPS/issues/3268]

  Background:
    Given I have an Awarded contract with an approved edit that requires a contract modification
    And it has a Planned budget line in the current fiscal year
    When I send a contract modification to approval that executes the Planned budget line
    Then the edit is listed as In Review
    And I cannot send another contract modification for the agreement

  Scenario: The Division Director approves the contract modification
    When the Division Director approves the contract modification
    Then a Modified LOE agreement modification is created with the edit attached
    And the budget line is Executing
    And no edits require a contract modification
    And I am notified that the contract modification was approved

  Scenario: The Division Director declines the contract modification
    When the Division Director declines the contract modification with notes
    Then the edit is pending again and not In Review
    And the budget line is still Planned
    And I am notified that the contract modification was declined
    And I can send a new contract modification
