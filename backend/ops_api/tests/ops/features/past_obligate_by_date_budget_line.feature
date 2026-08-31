Feature: Administrative Power User Can Set a Past Obligate-By Date on Budget Lines
  As an Administrative Power User (SUPER_USER), I want to be able to set an obligate-by date in
  the past when creating or editing a budget line so that I can record budget lines for obligations
  that occurred in a prior fiscal period. Non-admin users must continue to be blocked from setting
  an obligate-by date in the past.

  Scenario: Administrative Power User edits a planned BLI's obligate-by date to a past date
    Given I am logged in as an Administrative Power User
    And I have a valid Agreement
    And I have a PLANNED BLI with a future Need By Date

    When the Administrative Power User PATCHes the BLI with a past Need By Date

    Then the PATCH response is successful for the Administrative Power User

  Scenario: Administrative Power User creates a BLI and transitions it with a past obligate-by date
    Given I am logged in as an Administrative Power User
    And I have a valid Agreement

    When the Administrative Power User POSTs a DRAFT BLI with a past Need By Date
    And the Administrative Power User PATCHes the new BLI to PLANNED status

    Then the POST response creates the BLI successfully
    And the transition to PLANNED is successful for the Administrative Power User

  Scenario: Standard user is blocked from editing a planned BLI's obligate-by date to a past date
    Given I am logged in as a Budget Team user
    And I have a valid Agreement
    And I have a PLANNED BLI with a future Need By Date

    When the Budget Team user PATCHes the BLI with a past Need By Date

    Then the PATCH is rejected with a Need By Date in the future error

  Scenario: Standard user is blocked from transitioning a BLI to PLANNED with a past obligate-by date
    Given I am logged in as a Budget Team user
    And I have a valid Agreement

    When the Budget Team user POSTs a DRAFT BLI with a past Need By Date
    And the Budget Team user PATCHes the new BLI to PLANNED status

    Then the POST response creates the BLI successfully
    And the transition to PLANNED is rejected with a Need By Date in the future error
