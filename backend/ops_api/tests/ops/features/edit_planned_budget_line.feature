Feature: Edit Planned Budget Line Item
  As an OPRE staff member, I want to edit a budget line item.

  See: (Modify planned budget lines)[https://github.com/HHS/OPRE-OPS/issues/1001]

  Scenario: Successful Edit as Owner
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the original Agreement owner
    And I have a budget line item in Planned status
    And I edit the budget line item to change a value
    When I submit the budget line item
    Then I should get a message that it was successful

  Scenario: Successful Edit as Project Officer
    Given I am logged in as an OPS user
    And I have a Contract Agreement as the Project Officer
    And I have a budget line item in Planned status
    And I edit the budget line item to change a value
    When I submit the budget line item
    Then I should get a message that it was successful

  Scenario: Successful Edit as a Team Member
    Given I am logged in as an OPS user
    And I have a Contract Agreement as a Team Member
    And I have a budget line item in Planned status
    And I edit the budget line item to change a value
    When I submit the budget line item
    Then I should get a message that it was successful

  Scenario: Successful Edit as a member of the Budget Team
    Given I am logged in as an budget team member
    And I have a Contract Agreement as a member of the Budget Team
    And I have a budget line item in Planned status
    And I edit the budget line item to change a value
    When I submit the budget line item
    Then I should get a message that it was successful

  Scenario: Unsuccessful Edit
    Given I am logged in as an OPS user with the correct authorization but no perms
    And I have a Contract Agreement as an unauthorized user
    And I have a budget line item in Planned status
    And I edit the budget line item to change a value
    When I submit the budget line item
    Then I should get an error that I am not authorized
