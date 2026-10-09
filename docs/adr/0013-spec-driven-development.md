# ADR-0013: Spec-driven development with GitHub Spec Kit

**Context.** The rubric rewards product thinking, traceability and explicit decisions. A team needs a repeatable way to add features.

**Decision.** Use GitHub Spec Kit (`specify init --integration claude`).
- 7 principles that every plan must check (MVP first, layer boundaries, tests for business rules, config over hardcoding, pt-BR first, independent deploys, safe environments). They are recorded in the **Constitution Check** table of each `specs/NNN-name/plan.md`; `.specify/memory/constitution.md` itself is not committed.
- One folder per feature in `specs/NNN-name/` with `spec.md` (user stories, acceptance scenarios, requirements, success criteria), `plan.md` (technical context, constitution check, structure) and `tasks.md` (ordered, test-first).
- Agent skills: `/speckit-specify → /speckit-plan → /speckit-tasks → /speckit-implement` (plus clarify, analyze and checklist).

**Consequences.** Every endpoint, screen and pipeline maps back to an acceptance scenario, and the user stories in `docs/user-stories/` link to the specs. New contributors add a feature by running the skills above in order, which creates the next `specs/NNN-name/` folder.

**Alternatives.** Free-form tickets (decisions get lost). Heavyweight RFCs (too slow for this size).
