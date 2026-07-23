Feature: Edit Executing Budget Line Item
  As an OPRE staff member working an agreement through procurement, I want to edit a budget
  line item that is in Executing status, the same way I can edit a Planned one.

  See: (Submitting changes on BLs in Executing status)[https://github.com/HHS/OPRE-OPS/issues/5819]

  Scenario: Non-budget edit on an executing budget line applies directly
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    And I edit the budget line item description
    When I submit the budget line item
    Then I should get a message that it was successful

  Scenario: Budget edit on an executing budget line is routed to a change request
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    And I edit the budget line item amount
    When I submit the budget line item
    Then I should get a message that it was sent to approval

  Scenario: Editing is blocked once the agreement reaches Pre-Award
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    And the agreement has reached Pre-Award
    And I edit the budget line item description
    When I submit the budget line item
    Then I should get a validation error

  Scenario: Editing is blocked while a change request is pending
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Executing status
    And the budget line item has a change request in review
    And I edit the budget line item description
    When I submit the budget line item
    Then I should get a validation error

  Scenario: Unauthorized user cannot edit an executing budget line
    Given I am logged in as a basic user
    And I have a Contract Agreement without the user as a team member
    And I have a budget line item in Executing status
    And I edit the budget line item description
    When I submit the budget line item
    Then I should get an error that I am not authorized
