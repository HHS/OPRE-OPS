Feature: Delete Agreements
    As an OPRE staff member with the appropriate privaleges, I want to have the ability to delete
    contract agreements that only have budget lines in draft state.

Scenario: Contract Agreement with only draft BLIs
    Given I am logged in as an OPS user with the correct authorization
    And I have a contract agreement with only draft BLIs
    When I delete the agreement
    Then I should get a message that it was successful

Scenario: Contract Agreement with non-draft BLIs
    Given I am logged in as an OPS user with the correct authorization
    And I have a contract agreement with non-draft BLIs
    When I delete the agreement
    Then I should get an error message that it's invalid

Scenario: Contract Agreement as Project Officer
    Given I am logged in as an OPS user with the correct authorization
    And I have a contract agreement as the project officer
    When I delete the agreement
    Then I should get a message that it was successful

Scenario: Contract Agreement as Team Member
    Given I am logged in as an OPS user with the correct authorization
    And I have a contract agreement as a team member
    When I delete the agreement
    Then I should get a message that it was successful

Scenario: Contract Agreement I am not an authorized user for
    Given I am logged in as an OPS user with the correct authorization but no perms
    And I have a contract agreement I am not allowed to delete
    When I delete the agreement with a user that has no perms
    Then I should get an error message that I'm not authorized
