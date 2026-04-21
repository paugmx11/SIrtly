# Unit Test Scope

This folder contains tests that validate isolated behavior without relying on full API workflows.

## What belongs in `tests/Unit`
- Model configuration behavior (casts, hidden attributes, fillable/table definitions).
- Small pure logic checks that do not require end-to-end HTTP flows.
- Fast checks intended to fail early when basic domain rules are broken.

## What belongs in `tests/Feature`
- Endpoint behavior (`/api/...`) with request/response assertions.
- Authentication and authorization across routes and roles.
- Multi-step workflows that involve persistence and business process flows.

## Current Unit Coverage
- `UserModelTest`: hidden password serialization and boolean casting for `active`.
- `DomainModelsTest`: incident model config, company setting array casts, notification model config.
