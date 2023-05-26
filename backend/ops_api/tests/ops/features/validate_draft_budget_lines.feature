Feature: Validate "Draft" Budget Lines
  As an OPRE staff member, I want to insure that budget lines have valid input before moving to
  "In Review" status so that agreements have only correct data as they proceed through their lifecycle.

  Scenario: Valid Project
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Project

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Project

  Scenario: Valid Agreement Type
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Agreement Type

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Agreement Type

  Scenario: Valid Description
    Given I am logged in as an OPS user
    And I have an Agreement with an empty string Description

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Description

  Scenario: Valid Product Service Code
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Product Service Code

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Product Service Code

  Scenario: Valid Procurement Shop
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Procurement Shop

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Procurement Shop

  Scenario: Valid Agreement Reason
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Agreement Reason

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Agreement Reason

  Scenario: Valid Agreement Reason - NEW_REQ does not have an Incumbent
    Given I am logged in as an OPS user
    And I have an Agreement with an AgreementReason = NEW_REQ and an Incumbent

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ

  Scenario: Valid Agreement Reason - RECOMPETE and LOGICAL_FOLLOW_ON requires an Incumbent
    Given I am logged in as an OPS user
    And I have an Agreement with an AgreementReason = RECOMPETE or LOGICAL_FOLLOW_ON and has a NULL or empty string Incumbent

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have an Incumbent if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON

  Scenario: Valid Project Officer
    Given I am logged in as an OPS user
    And I have an Agreement without a Project Officer

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a Project Officer

  Scenario: Valid Team Members
    Given I am logged in as an OPS user
    And I have an Agreement without any Team Members

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have at least one Team Member

  Scenario: Valid Description
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a Description
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI must have a Description


  Scenario: Valid Need By Date
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a Need By Date
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI must have a Need By Date

  Scenario: Valid CAN
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a CAN
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI must have a CAN

  Scenario: Valid Amount
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without an Amount
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI must have an Amount

  Scenario: Valid Agreement
    Given I am logged in as an OPS user

    When I have a BLI in DRAFT status without an Agreement
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI must have an Agreement
