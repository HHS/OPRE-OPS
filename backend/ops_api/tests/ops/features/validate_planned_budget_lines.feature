Feature: Validate "Planned" Budget Lines
  As an OPRE staff member, I want to insure that budget lines have valid input before moving to
  "Planned" status so that agreements have only correct data as they proceed through their lifecycle.

  Scenario: Valid Project
    Given I am an logged in as an OPS user
    And I have an Agreement with a NULL Project
    And I have a BLI in DRAFT status

    When I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Project

  Scenario: Valid Agreement Type
    Given: I am an logged in as an OPS user
    And: I have a BLI in DRAFT status

    When: I submit a BLI to move to IN_REVIEW status
    And: The BLI's Agreement has a NULL Agreement Type

    Then: I should get an error message that the BLI's Agreement must have
      a valid Agreement Type

  Scenario: Valid Description
    Given: I am an logged in as an OPS user
    And: I have a BLI in DRAFT status

    When: I submit a BLI to move to IN_REVIEW status
    And: The BLI's Agreement has an empty string "" Description

    Then: I should get an error message that the BLI's Agreement must have
      a valid Description

  Scenario: Valid Product Service Code
    Given: I am an logged in as an OPS user
    And: I have a BLI in DRAFT status

    When: I submit a BLI to move to IN_REVIEW status
    And: The BLI's Agreement has a NULL Product Service Code

    Then: I should get an error message that the BLI's Agreement must have
      a valid Product Service Code

  Scenario: Valid Procurement Shop
    Given: I am an logged in as an OPS user
    And: I have a BLI in DRAFT status

    When: I submit a BLI to move to IN_REVIEW status
    And: The BLI's Agreement has a NULL Procurement Shop

    Then: I should get an error message that the BLI's Agreement must have
      a valid Procurement Shop

  Scenario: Valid Agreement Reason
    Given: I am an logged in as an OPS user
    And: I have a BLI in DRAFT status

    When: I submit a BLI to move to IN_REVIEW status
    And: The BLI's Agreement has a NULL Agreement Reason

    Then: I should get an error message that the BLI's Agreement must have
      a valid Agreement Reason
