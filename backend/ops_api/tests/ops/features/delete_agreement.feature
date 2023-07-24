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

Scenario: Non-Contract Agreement
    Given I am logged in as an OPS user with the correct authorization
    And I have a non-contract agreement
    When I delete the agreement
    Then I should get an error message that it's invalid