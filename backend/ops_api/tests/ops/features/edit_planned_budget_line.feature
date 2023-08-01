Feature: Edit Planned Budget Line Item
  As an OPRE staff member, I want to edit a budget line item.

  See: (Modify planned budget lines)[https://github.com/HHS/OPRE-OPS/issues/1001]

  Scenario: Successful Edit as Owner
    Given I am a logged in as an OPS user who is the original Agreement Owner
    And I have a Contract Agreement with a budget line in Planned status
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Successful Edit as Project Officer
    Given I am a logged in as an OPS user who is the Project Officer
    And I have a Contract Agreement with a budget line in Planned status
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Successful Edit as a Team Member
    Given I am a logged in as an OPS user who is a Team Member
    And I have a Contract Agreement with a budget line in Planned status
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Successful Edit as a member of the Budget Team
    Given I am a logged in as an OPS user who is a member of the Budget Team
    And I have a Contract Agreement with a budget line in Planned status
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful

  Scenario: Unsuccessful Edit
    Given I am a logged in as an OPS user who is not a part of the Agreement or the Budget Team
    And I have a Contract Agreement with a budget line in Planned status
    And I edit the agreement to change a value
    When I submit the agreement
    Then I should get an message that it was successful