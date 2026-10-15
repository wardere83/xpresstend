# Bank audit and identity controls

## Release status

This change adds provider adapters and bank audit operations to the existing Cloudflare Worker / D1 backend. It does **not** activate money movement, establish legal compliance, replace bank due diligence, or assert a signed provider contract. Payment and payout handlers remain explicitly test-only. Do not replace them with live execution until the bank has approved the controls and the outstanding requirements below have been addressed.

Production now fails closed unless customer identity evidence and global screening are available. Existing manually verified customers must complete provider verification. Staff cannot override missing ID or liveness evidence. Test fixtures use `ENVIRONMENT=test`; development can exercise the same gates with `COMPLIANCE_PROVIDERS_REQUIRED=true`.

## Activation

1. Apply `api/migrations/0009_bank_compliance.sql` before deploying the Worker. The main deployment workflow now includes this idempotent migration. Take the normal database backup before deployment.
2. Contract and configure Persona. Store `PERSONA_API_KEY` and `PERSONA_TEMPLATE_ID` as Worker secrets. Select a production inquiry template with government ID validity/authenticity, ID/account name matching, live selfie and selfie-to-ID comparison required, with approved/declined/review outcomes. Validate sandbox first and switch to production credentials through the existing secret management process. No key is placed in browser code.
3. Contract and configure ComplyAdvantage's documented Search API. Store `COMPLYADVANTAGE_API_KEY` as a Worker secret. This adapter uses `https://api.complyadvantage.com/searches`, token authentication, person names, `sanction` types and fuzziness 0.6. No country filter is applied: Kenyan/Somali recipients must not be screened only against destination-country lists. Validate global list coverage, thresholds, transliteration and response schemas with the contracted plan. The existing official OFAC layer remains in place.
4. Review the customer biometric consent, provider privacy policy, data retention agreement, permitted geographies and approved template with compliance counsel and the host bank. Real provider latency and manual review mean completion cannot be guaranteed to be instant.
5. Sign in at `https://xpresstend.com/#/admin`. Open **Compliance & banks**. Owners create a named bank connection and securely hand the one-time API token to that bank. Credentials are hashed in D1, expire after 90 days and can be revoked. Use your bank's approved TLS/API gateway controls, including mTLS or network restrictions if required, before external production onboarding.
6. Execute provider contract tests and the bank's acceptance suite in staging before live use. No actual provider or bank credentials were available during development.

The “Configured” card checks configuration presence, not vendor availability, contracted coverage or certification. Provider errors, malformed data and unresolved matches block sends. New name searches with matches are held conservatively; provider false-positive labels do not automatically authorize a transfer. A bank-approved false-positive adjudication workflow for the global provider is an outstanding production requirement.

## Customer experience

Profile → **Verify government ID and live selfie** opens a consent-based hosted Persona flow. The backend creates inquiries tied to the customer ID. The customer opens the secure provider page and returns to XpressTend. The app polls the authenticated backend every 25 seconds while pending, or the customer checks immediately on return. The backend retrieves the inquiry directly from Persona with linked verifications; browser callbacks never grant verification.

Approval requires matching inquiry/customer/template, a passed government ID bearing the account's name, and a passed selfie with explicit liveness and ID-comparison checks. Only minimal outcome references are retained; ID photos, document numbers and biometric media are not copied to D1. Manual review and mismatched names remain pending. Hosted mobile flow/camera permissions still require physical iOS and Android acceptance tests.

Before the Send action becomes available, preflight checks identity and both sender and recipient sanctions. Preflight repeats every 45 seconds and is not an authorization token. Creation, payment and staff release independently repeat server-side checks. Immutable global provider evidence is recorded on each attempt. Existing transfer state/account/session/OFAC guards and balanced ledger postings remain transactional.

## Bank API v1

All requests require `Authorization: Bearer <bank-token>`. Responses use `Cache-Control: no-store`; all API accesses are audited. Rate limit: 120 requests per minute per key. No password, session token, raw ID document or biometric material is returned.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/bank/v1/batches?after=<cursor>` | Up to 50 batches assigned to the authenticated bank; use `nextCursor` while paging. Start from the beginning for each polling cycle to observe status changes. |
| GET | `/api/bank/v1/batches/:id` | Exact sender/recipient manifest, principal contribution, fee, destination amount, ledger postings and recent global screening references. |
| POST | `/api/bank/v1/batches/:id/decision` | Record the bank's own approval or rejection against an exact manifest hash. |

The bank polls these endpoints for current database visibility; this is pull-based, not a streaming or webhook service. Other banks' batches return 404. The client must handle 401 (expired/revoked), 409 (conflicting/stale decision), 429 (rate limit) and 5xx (retry without executing funds).

Decision body:

```json
{
  "decision": "approved",
  "manifestHash": "SHA-256 returned by the batch endpoint",
  "reference": "bank-unique-review-reference",
  "reason": "Bank completed screening of all individual contributions."
}
```

`decision` is `approved` or `rejected`. `reference` is 3–200 characters; `reason` is 20–2000 characters. Duplicate references return 409 without another decision. A renewed approval requires a new reference and a new bank review. Rejected batches cannot be approved through this endpoint. Approval lasts five minutes and is invalidated by key revocation, changed names/amounts or a later rejection. An approval records a bank attestation; it does not execute a wire or prove that the bank actually performed screening.

## Reconciliation and audit

Compliance staff select 1–100 funded, unassigned transfers in one send currency. Principal contributions sum exactly to the manifest total in integer minor units; fees and recipient-currency amounts are separate. Each transfer may belong to only one batch. The immutable snapshot preserves sender and recipient names at submission. Database triggers reject partial reconciliation and roll back the transaction if a selected transfer changes before commit.

`manifestCanonical` is the exact JSON UTF-8 string used for SHA-256. The bank hashes that string, compares `manifest_hash`, screens its individuals and submits a decision. Keys are bank-scoped; no raw database credentials are shared. SQL guards recheck bank approval before a batch-assigned payout. Production release additionally requires a batch assignment. Ledger, audit, batch items and provider evidence reject UPDATE/DELETE. These controls are append-only within application/database access, not an external WORM archive or blockchain; database administrators still require independent access monitoring and backups.

## Staff access requested

| Email | Intended role | Activation |
|---|---|---|
| abdikarim@xpresstend.com | Compliance | Owner-issued, single-use password setup link |
| support@xpresstend.com | Owner | Owner-issued, single-use password setup link |

`api/scripts/provision-compliance-staff.mjs` provisions these two accounts using an existing authenticated owner session supplied in `XPT_OWNER_SESSION`. It preserves existing accounts and does not alter existing roles. It requests email delivery and records each result, including any undelivered activation link, in a private 0600 file outside the repository. Invited accounts cannot log in until they set a password. Do not put the cookie or activation links in commits or logs. Production accounts have **not** been provisioned by merely adding this script.

## Outstanding live-operation gates

- Provider production credentials, configured policies and live contract tests.
- Host-bank API/security sign-off, sanctions disposition workflow and approved wire execution/reconciliation integration.
- Staff MFA/SSO and bank-required segregation of duties. This change retains the existing password-based staff authentication.
- Bank-specific mandatory originator/beneficiary fields, travel-rule/recordkeeping requirements, retention and ongoing monitoring policies. The manifest currently exposes names, internal IDs, corridor, amounts and evidence; it is not a complete regulatory wire message.
- Batch rejection/rework and expired approval operational procedures; no funds are released automatically.
- Physical-device ID/camera flow validation and approved biometric notices.

## Provider references

- https://docs.withpersona.com/api-reference/inquiries/create-an-inquiry
- https://docs.withpersona.com/api-reference/inquiries/retrieve-an-inquiry
- https://docs.withpersona.com/api-reference/verifications/selfie-verifications/retrieve-a-selfie-verification
- https://docs.complyadvantage.com/api-docs/


## Operational web workspaces

`/#/admin` is a viewport-height workspace: navigation, summary metrics and refresh controls remain visible while the selected data pane scrolls independently. Transfer workflow actions load the actual held-transfer queue and open its next screening record without buying another provider search. Owners can open the staff invitation form directly. Compliance tabs separate connection readiness, batch assembly, evidence and scoped credentials.

`GET /api/admin/compliance/readiness` is restricted to owners/compliance. It reports the current OFAC dataset status, provider configuration presence and active bank-key count, without returning credentials. “Configured” is not a provider health check or certification. Existing missing-provider and release guards remain unchanged.

`/#/bank-review` is an operational partner-bank portal for the existing bank API. A bank enters its privately issued scoped key; the key stays in tab memory and is cleared on disconnect/401. The portal reads only assigned batches, verifies SHA-256 against the exact canonical manifest and reconciles principal totals before enabling a decision. Approval/rejection requires a bank reference and review reason. The server independently enforces scope, hash, expiry, duplicate-reference and revocation rules. This is review-only and never executes a wire. The bank does not need a customer or staff cookie.

The public `/#/demo` is isolated from transfer/account APIs. It provides local sample recipient, amount, review and activity steps. It never creates an account, submits a transfer or claims delivery.

Open-source identity engines require separate infrastructure, a reviewed document/liveness policy and an authenticated server-side adapter. For example, Idswyft Community (https://github.com/team-idswyft/idswyft-community) uses a Docker/ML/PostgreSQL stack with materially different hosting requirements from this Worker. No unhosted GitHub project is represented as a live verifier. The existing Persona integration remains connection-ready and fails closed until configured and validated.
