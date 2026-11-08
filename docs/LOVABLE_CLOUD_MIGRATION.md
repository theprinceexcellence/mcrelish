# McRelish Lovable Cloud to PHP/MySQL Integration

## Status

Planning and source-reconciliation branch. This document does not change production code or the live Smartweb deployment.

## Selected system boundaries

- Frontend foundation: this repository (`mcrelish_frontend`).
- Feature reference: Lovable source repository (`mcrelish`).
- Production API foundation: `mcrelish_backend`.
- Production database: the existing MySQL/MariaDB database used by the PHP backend.
- Hosting target: Smartweb cPanel.
- Payment provider: Flutterwave.

The Lovable project's documentation states that its live application uses Lovable Cloud (PostgreSQL, Auth, Row-Level Security and storage), while its bundled PHP backend is a separate portable implementation. Do not merge the bundled Lovable PHP backend over `mcrelish_backend`.

## Non-negotiable migration rules

1. Keep the live site and production database unchanged during development.
2. Do not disconnect Lovable Cloud until every required data set and workflow has a tested PHP/MySQL replacement.
3. Do not copy production customer data into development or staging without an approved, protected migration process.
4. Never commit secrets, production environment files, database dumps, customer data, or payment credentials.
5. Use additive, reversible database migrations where practical; document rollback steps.
6. The PHP API is authoritative for prices, delivery fees, permissions, order state, and payment state.
7. Do not treat frontend validation as a security boundary.
8. All payment webhooks and confirmation callbacks must be idempotent.

## Feature migration register

| Feature | Target | Required work | Acceptance evidence |
|---|---|---|---|
| Customer authentication and profiles | PHP Auth + MySQL | Map profile fields; preserve password-reset flow; define account migration strategy | Signup, login, logout, profile and reset tests |
| Managed menu catalogue | PHP catalogue endpoints + MySQL | Map categories, items, variants, availability, images and prices | Public menu and admin CRUD tests |
| Cart and pricing | Frontend + PHP PricingService | Keep cart client-side; reprice every line on server at checkout | Tampering tests prove client totals are ignored |
| Orders and tickets | PHP order endpoints | Map delivery details, notes, references, status and ticket access | Full order lifecycle tests |
| Flutterwave payments | PHP payment service | Verify exact expected amount, currency, transaction reference and status; make callbacks idempotent | Valid, underpayment, overpayment, wrong-currency, duplicate and replay tests |
| Delivery zones | PHP delivery endpoints | Map zones, fee rules and availability | Boundary and fee calculation tests |
| Delivery coordinates and PIN | New MySQL fields/endpoints | Validate coordinates; define PIN lifecycle, access and retention | Valid/invalid coordinate and PIN authorization tests |
| Staff roles and admin policies | PHP Auth/role middleware | Map Lovable roles to server-enforced permissions | Unauthorized role/action tests |
| Marketing consent | New consent ledger | Store purpose, status, timestamp, policy version and capture source; support withdrawal | Consent history and withdrawal tests |
| Marketing preferences | Customer preference endpoints | Store granular channel/purpose preferences | Read/update and authorization tests |
| Legal documents | New versioned legal-document module | Store document type, version, content, publication state and effective date | Admin publish and public rendering tests |
| Campaigns/promotions | Extend promotion module | Map eligibility, dates, limits and campaign reporting | Expiry, eligibility and redemption tests |
| Private storage | Smartweb storage outside public web root where supported | Validate MIME/type/size; randomize names; prevent script execution; authorize private access | Upload abuse and access-control tests |
| Analytics and audit | PHP reporting/audit | Reconcile metric definitions and retain sensitive admin audit events | Totals reconcile to order ledger |

## Required schema design (proposed; validate against live schema before migration)

- `customer_marketing_consents`: customer_id, purpose, channel, consent_status, policy_version, source, captured_at, withdrawn_at.
- `customer_marketing_preferences`: customer_id, channel, purpose, enabled, updated_at.
- `legal_documents`: document_type, version, title, body, status, effective_at, published_at, created_by.
- `customer_legal_acceptances`: customer_id, document_type, document_version, accepted_at, source.
- Delivery coordinate fields: add nullable latitude/longitude and validation metadata to the appropriate order/address entity only after confirming the existing data model.
- Campaign fields/tables: extend existing promotion tables only after reviewing current promotion semantics and data.

Do not run these schema changes until the existing production schema and data relationships have been inspected and a rollback plan has been approved.

## API contract work

Before frontend integration, publish a versioned API contract for:
- `/api/auth/*`
- `/api/config`
- `/api/menu`
- `/api/delivery-zones`
- `/api/orders`
- `/api/orders/confirm`
- `/api/orders/{reference}`
- `/api/payments/webhook`
- admin menu, order, delivery, store, promotion, staff and audit routes
- new consent, preferences, legal-document, coordinate and campaign routes

Document request/response schemas, authentication requirements, role requirements, error codes, pagination and idempotency behavior.

## Smartweb deployment constraints

The supplied Smartweb Resource Usage screenshot showed a 1 GB physical-memory limit, 100% CPU allowance, 20 entry processes and 1 MB/s I/O limit. These are account limits, not proof of sustained application capacity.

Preferred deployment shape:
- Build the React application into static assets.
- Serve static frontend files through the web server.
- Serve the PHP API from the configured API document root.
- Use MySQL/MariaDB for production persistence.
- Use cron only for tasks that need scheduling and are supported by the hosting account.
- Avoid requiring a continuously running Node.js SSR process unless Smartweb explicitly supports it for this account.

## Release gates

A release is not ready until all are true:

- Frontend has no remaining production dependency on Lovable Cloud for migrated workflows.
- Database migrations have been tested on a non-production copy.
- Customer, order, menu, promotion and staff data mappings are reconciled.
- Payment amount/currency/reference verification and webhook idempotency pass tests.
- Authorization and file-upload tests pass.
- End-to-end customer and admin workflows pass on Smartweb staging.
- Backup restoration and rollback have been rehearsed.
- Production cutover is explicitly approved by the owner.

## Current evidence and limitations

- The Smartweb archive contains compiled frontend assets and the deployed PHP backend.
- The original frontend source is available in this repository.
- The Lovable source ZIP documents Lovable Cloud as the live data/auth/storage backend and includes a separate portable PHP backend.
- Three deployed backend files were previously found to match their GitHub counterparts: `public/index.php`, `src/Services/PaymentService.php`, and `database/schema.sql`.
- This is not yet a full-file deployment diff, runtime test, production schema inspection, or security certification.
- The current branch is an isolated planning branch. No production files, default branches, hosting files, or live databases have been changed.
