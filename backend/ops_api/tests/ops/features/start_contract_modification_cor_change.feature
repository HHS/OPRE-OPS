Feature: Start a Contract Modification for a COR change
  As a COR, I want to send a COR change on an Awarded contract to my Division Director as a
  Contract Modification, so the COR changes in OPS once the modification is approved.

  See: (Start a Contract Modification for a COR change)[https://github.com/HHS/OPRE-OPS/issues/3269]

  Scenario: The Division Director approves a contract modification with only a COR change
    Given I have an Awarded contract with a pending COR change
    When I send a contract modification to approval without selecting budget lines
    Then the COR change is listed as In Review
    And the COR cannot be changed again
    When the Division Director approves the contract modification
    Then the agreement's COR is the new COR
    And an Admin agreement modification is created with the COR change attached
    And the agreement history records the COR change
