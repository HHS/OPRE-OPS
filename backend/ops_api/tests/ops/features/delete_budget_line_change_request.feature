Feature: Delete a Budget Line Item as a Change Request
  As an OPRE staff member, deleting a Planned or Executing budget line item should require
  Division Director approval, while a Draft budget line item is still deleted immediately.

  See: (Submitting changes on BLs in Executing status)[https://github.com/HHS/OPRE-OPS/issues/5819]

  Scenario: Deleting a draft budget line is immediate
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Draft status
    When I delete the budget line item
    Then the budget line item should be deleted immediately

  Scenario: Deleting a planned budget line creates a change request
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Planned status
    When I delete the budget line item
    Then the deletion should be sent to approval
    And the budget line item should still exist

  Scenario: Deleting an executing budget line creates a change request
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    When I delete the budget line item
    Then the deletion should be sent to approval
    And the budget line item should still exist

  Scenario: Deletion is blocked once the agreement reaches Pre-Award
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    And the agreement has reached Pre-Award
    When I delete the budget line item
    Then I should get a validation error

  Scenario: Deletion is blocked while a change request is pending
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Planned status
    And the budget line item has a change request in review
    When I delete the budget line item
    Then I should get a validation error

  Scenario: Unauthorized user cannot delete a budget line
    Given I am logged in as a basic user
    And I have a Contract Agreement without the user as a team member
    And I have a budget line item in Planned status
    When I delete the budget line item
    Then I should get an error that I am not authorized
