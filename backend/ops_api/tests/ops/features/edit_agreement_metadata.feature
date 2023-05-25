Feature: Edit Agreement Metadata
  As an OPRE staff member, I want to edit agreement metadata.

  See: (Edit Draft Agreement Metadata)[https://github.com/HHS/OPRE-OPS/issues/856]

  Scenario: Required Fields
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    When I submit a Contract Agreement that is missing required fields
    Then I should get an error message that it's invalid

