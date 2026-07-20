# SOS future activation requirements

The current delivery permits only the public, non-operational SOS demonstration. The application
must keep live alert transmission, geolocation capture, administrator visibility and notifications
disabled. No production SOS or incident record may be created.

Operational activation requires all of the following before any feature flag is changed:

- Approved park emergency procedures.
- Named and trained responsible staff.
- Confirmed emergency contact numbers.
- Approved location-consent and privacy wording.
- Configured and tested notification providers.
- Tested server-side administrator permissions.
- Approved incident-retention and deletion rules.
- Completed non-emergency response drills.
- Written client approval to activate the operational system.

Activation must be performed as a controlled release with server-side authorisation, audit logging,
failure testing and a rollback plan. A public demonstration must never be treated as evidence that
the operational safety service is available.
