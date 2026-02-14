Feature: Validate Procurement Tracker Steps
  As an OPRE staff member, I want to ensure that procurement steps have valid input before moving to


  Scenario: Valid Procurement Step Update
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a valid completed procurement step 1
    And I submit a procurement step update

    Then I should get a message that it was successful and my procurement tracker has moved onto the next step

  Scenario: User belongs to Agreement
    Given I am logged in as an OPS user
    And I have a Contract Agreement without OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a valid completed procurement step 1
    And I submit a procurement step update

    Then I should get an error message that users must be associated with an agreement

  Scenario: Valid Task Completed By
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a procurement step with a non-existent user in the task_completed_by step
    And I submit a procurement step update

    Then I should get an error message that users must be associated with an agreement

  Scenario: Valid Completion Date
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a procurement step with an invalid completion date
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate no future completion date for acquisition planning
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a procurement step with a date completed in the future
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Valid status
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a procurement step with an invalid status
    And I submit a procurement step update

    Then I should get a validation error

Scenario: When no presolicitation package is sent to proc shop, the request is valid with unfilled request
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker
  And I am working with acquisition planning procurement tracker step

  When I have a procurement step with no presolicitation package sent to procurement shop
  And I submit a procurement step update

  Then I should get a message that it was successful and my procurement tracker has moved onto the next step

Scenario: Cannot update completed procurement tracker step
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker with a completed step 1
  And I am working with acquisition planning procurement tracker step

  When I have a valid completed procurement step 1
  And I submit a procurement step update

  Then I should get a validation error

Scenario: Validate Procurement Tracker Step exists
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker with no steps
  And I am working with acquisition planning procurement tracker step

  When I have a valid completed procurement step 1
  And I submit a procurement step update

  Then I should get a resource not found error

Scenario: Validate Procurement Tracker Step 2 Complete Update
  Given I am logged in as an OPS user
  And I have a Contract Agreement with OPS user as a team member
  And I have a procurement tracker
  And I am working with a pre-solicitation procurement tracker step

  When I have a valid completed procurement step 2
  And I submit a procurement step update

  Then I should get a message that it was successful and my procurement tracker has moved onto the next step

Scenario: Valid Task Completed By Step 2
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with a non-existent user in the task_completed_by step
    And I submit a procurement step update

    Then I should get an error message that users must be associated with an agreement

  Scenario: Valid Completion Date Step 2
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with an invalid completion date
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate no future completion date for pre-solicitation
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with a date completed in the future
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre solicitation target completion date must be today or future date
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with a target date in the past
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre solicitation target completion date must be today or future date on model
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step with a past target completion date

    When I have a procurement step 2 with no target completion date
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre solicitation step can have required fields spread between model and update
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step with a valid date completed

    When I have a procurement step 2 with a valid task_completed_by
    And I submit a procurement step update

    Then I should get a message that it was successful and my procurement tracker has moved onto the next step

  Scenario: Validate pre solicitation must have required fields between model and update
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step with a valid date completed

    When I have a procurement step 2 with a valid target completion date and complete status
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre solicitation step draft solicitation date in update cannot be in the past
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with a past draft solicitation date
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre solicitation step draft solicitation date in the model cannot be in the past
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step with a past draft solicitation date

    When I have a valid completed procurement step 2
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Complete Procurement Tracker
      Given I am logged in as an OPS user
      And I have a Contract Agreement with OPS user as a team member and a new award procurement action
      And I have a procurement tracker with an uncompleted final step and procurement action
      And I am working with the final procurement tracker step

      When I have a valid completed final procurement step
      And I submit a procurement step update

      Then I should get a message that it was successful and my procurement tracker has completed. Also, the procurement action's status should be awarded

  Scenario: Validate acquisition planning notes cannot exceed 750 characters
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with acquisition planning procurement tracker step

    When I have a procurement step with notes exceeding 750 characters
    And I submit a procurement step update

    Then I should get a validation error

  Scenario: Validate pre-solicitation notes cannot exceed 750 characters
    Given I am logged in as an OPS user
    And I have a Contract Agreement with OPS user as a team member
    And I have a procurement tracker
    And I am working with a pre-solicitation procurement tracker step

    When I have a procurement step 2 with notes exceeding 750 characters
    And I submit a procurement step update

    Then I should get a validation error
