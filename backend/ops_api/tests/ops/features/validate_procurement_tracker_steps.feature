Feature: Validate Procurement Tracker Steps
  As an OPRE staff member, I want to ensure that procurement steps have valid input before moving to


  Scenario: Valid Procurement Step Update
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a valid completed procurement step
    And I submit a procurement step update

    Then I should get a message that it was successful and my procurement tracker has moved onto the next step

  Scenario: User belongs to Agreement
    Given I am logged in as an OPS user
    And I have a Contract Agreement without OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a valid completed procurement step
    And I submit a procurement step update

    Then I should get an error message that users must be associated with an agreement

  Scenario: Valid Task Completed By
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a procurement step with a non-existent user in the task_completed_by step
    And I submit a procurement step update

    Then I should get an error message that users must be associated with an agreement

  Scenario: Valid Completion Date
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a procurement step with an invalid completion date
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate no future completion date for acquisition planning
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a procurement step with a date completed in the future
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Valid status
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker with an empty step number 1

    When I have a procurement step with an invalid status
    And I submit a procurement step update

    Then I should get a validation error

Scenario: When no presolicitation package is sent to proc shop, the request is valid with unfilled request
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker with an empty step number 1

  When I have a procurement step with no presolicitation package sent to procurement shop
  And I submit a procurement step update

  Then I should get a message that it was successful and my procurement tracker has moved onto the next step

Scenario: Cannot update completed procurement tracker step
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker with a completed step 1

  When I have a valid completed procurement step
  And I submit a procurement step update

  Then I should get a validation error

Scenario: Validate Procurement Tracker Step exists
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker with no steps

  When I have a valid completed procurement step
  And I submit a procurement step update

  Then I should get a resource not found error

Scenario: Complete Procurement Tracker
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member and a new award procurement action
    And I have a procurement tracker with an uncompleted final step and procurement action

    When I have a valid completed final procurement step
    And I submit a procurement step update

    Then I should get a message that it was successful and my procurement tracker has completed. Also, the procurement action's status should be awarded
