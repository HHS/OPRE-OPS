Feature: Edit Agreement Metadata
  As an OPRE staff member, I want to edit agreement metadata.

  See: (Edit Draft Agreement Metadata)[https://github.com/HHS/OPRE-OPS/issues/856]

  Scenario: Required Fields
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    And I edit the agreement to remove a required field
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Successful Edit
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Successful Edit of Just Notes
    Given I am a logged in as an OPS user
    And I have a Contract Agreement
    When I submit a new value for notes
    Then I should get an message that it was successful

  Scenario: Failed Edit because In Execution
    Given I am a logged in as an OPS user
    And I have a Contract Agreement with a BLI in execution
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an error message that it's invalid

  Scenario: Successful Edit Non-Draft BLI
    Given I am a logged in as an OPS user
    And I have a Contract Agreement with a BLI in planned
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful
    And the Agreement's budget line items are all now Draft

  Scenario: Division Director can edit Agreement metadata
    Given I am a logged in as an OPS user
    And I have a Contract Agreement associated with a CAN where I am the Division Director
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Unassociated user cannot edit Agreement metadata
    Given I am a logged in as an OPS user
    And I have a Contract Agreement I am not associated with
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an error message that I'm not authorized

  Scenario: Portfolio Team Leader can edit Agreement metadata
    Given I am a logged in as an OPS user
    And I have a Contract Agreement associated with a CAN where I am the Portfolio Team Leader
    And I edit the agreement to change a value
    When I submit the aSystem owner can edit Agreement metadatagreement
    Then I should get an message that it was successful

  Scenario: 
    Given I am a logged in as a system owner
    And I have a Contract Agreement associated with a CAN where I am the system owner
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful
