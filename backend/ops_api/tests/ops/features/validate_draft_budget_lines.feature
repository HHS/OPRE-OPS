Feature: Validate "Draft" Budget Lines
  As an OPRE staff member, I want to insure that budget lines have valid input before moving to
  "In Review" status so that agreements have only correct data as they proceed through their lifecycle.

 Scenario: Valid Agreement
    Given I am logged in as an OPS user

    When I have a BLI in DRAFT status without an Agreement
    And I submit a BLI to move to IN_REVIEW status (without an Agreement)

    Then I should get an error message that the BLI must have an Agreement

  Scenario: Valid Project
    Given I am logged in as an OPS user
    And I have an Agreement with a NULL Project

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a valid Project

  Scenario: Valid Agreement Description
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

  Scenario: Valid Agreement Reason - NEW_REQ does not have a Vendor
    Given I am logged in as an OPS user
    And I have an Agreement with an AgreementReason = NEW_REQ and a Vendor

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement cannot have a Vendor if it has an Agreement Reason of NEW_REQ

  Scenario: Valid Agreement Reason - RECOMPETE and LOGICAL_FOLLOW_ON requires a Vendor
    Given I am logged in as an OPS user
    And I have an Agreement with an AgreementReason = RECOMPETE or LOGICAL_FOLLOW_ON and has a NULL or empty string Vendor

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a Vendor if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON

  Scenario: Valid Project Officer
    Given I am logged in as an OPS user
    And I have an Agreement without a Project Officer

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status

    Then I should get an error message that the BLI's Agreement must have a Project Officer


  Scenario: Valid Need By Date: Both NULL
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a Need By Date
    And I submit a BLI to move to IN_REVIEW status (without Need By Date)

    Then I should get an error message that the BLI must have a Need By Date

  Scenario: Valid Need By Date: Request Empty
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status with an empty Need By Date

    Then I should get an error message that the BLI must have a Need By Date (for PUT only)

  Scenario: Valid Need By Date: Both Empty
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a Need By Date
    And I submit a BLI to move to IN_REVIEW status with an empty Need By Date

    Then I should get an error message that the BLI must have a Need By Date (with empty Request)

  Scenario: Valid Need By Date: Future Date
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status with a Need By Date in the past or today
    And I submit a BLI to move to IN_REVIEW status with an empty Need By Date

    Then I should get an error message that the BLI must have a Need By Date in the future

  Scenario: Valid CAN: Both NULL
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without a CAN
    And I submit a BLI to move to IN_REVIEW status (without a CAN)

    Then I should get an error message that the BLI must have a CAN

  Scenario: Valid CAN: Request Empty
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status (without a CAN)

    Then I should get an error message that the BLI must have a CAN (for PUT only)

  Scenario: Valid Amount: Both NULL
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status without an Amount
    And I submit a BLI to move to IN_REVIEW status (without an Amount)

    Then I should get an error message that the BLI must have an Amount

  Scenario: Valid Amount: Request Empty
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status
    And I submit a BLI to move to IN_REVIEW status (without an Amount)

    Then I should get an error message that the BLI must have an Amount (for PUT only)

  Scenario: Valid Amount: Greater than 0
    Given I am logged in as an OPS user
    And I have a valid Agreement

    When I have a BLI in DRAFT status with an Amount less than or equal to 0
    And I submit a BLI to move to IN_REVIEW status (with an Amount less than or equal to 0)

    Then I should get an error message that the BLI must have an Amount greater than 0
