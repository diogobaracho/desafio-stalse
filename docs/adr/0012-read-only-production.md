# ADR-0012: Read-only production (app flag + RBAC)

**Context.** Production is a read-only environment: a live, safe demo and reference. Nobody should change data or infrastructure by hand.

**Decision. Two independent layers:**
1. **Application:** `READ_ONLY_MODE=true` (prod overlay). The service layer rejects every mutation with **403 `read_only_mode`** before touching the database. `/health` exposes `read_only`; the UI shows a banner and disables the triage controls. The CD smoke test asserts `read_only == true`.
2. **Access:** in prod, the engineers' Entra group gets only **Reader** on the resource group plus **AKS RBAC Reader** (and Cluster User to fetch credentials). Changes reach prod only through GitHub Actions running as the prod OIDC identity, behind the **`production` environment's required reviewers**. A `CanNotDelete` lock protects the resource group. In dev, the same group is Contributor + AKS RBAC Writer.

**Consequences.** UI-only hiding would not be enough; it is enforced in the service. Break-glass access (temporary elevation via PIM) is an organizational process documented in the deployment guide, not code.

**Alternatives.** A separate read-only build (diverges from tested images). DB-level read-only user (stronger, but returns 500s instead of a clear 403; possible future hardening).
