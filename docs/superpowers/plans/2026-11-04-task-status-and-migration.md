# Task status and portable project implementation plan

**Goal:** Let a person classify a ticket as completed, deferred or incomplete, then move the current checkout to D:/DSH-Superagent and prepare a clean GitHub source archive.
**Architecture:** Persist human status on Ticket, stop only that ticket on classification, and permit explicit resume of deferred/incomplete tickets after mandate revalidation. Reuse Host API from both the existing panel and independent Neo task screen.
**Spec:** User request 2026-11-04; preserve existing local edits and do not push.

- [ ] Add Ticket.review, Engine.setTicketStatus/resumeTicket and Host PUT tickets/:id/status / POST tickets/:id/resume. Completed ends work; deferred and incomplete wait for explicit resume. Never merge or send GitHub messages from these controls.
- [ ] Add visible status controls to ticket detail and a Tasks screen to the independent Neo page, with errors, busy state and polling refresh.
- [ ] Cover persistence, cancellation, resume authorization, API validation, and UI actions with focused tests; run typecheck and both builds.
- [ ] Write Chinese README with setup, account roles, task workflow, status meanings, dependency on Host and upload steps.
- [ ] Verify the migrated checkout, update local profile links and restart from the new root. Preserve external state and credentials.
- [ ] Commit only this round changes. Package the entire current source snapshot, excluding dependencies, Git internals, credentials and runtime data; record pre-existing edits separately.
- [ ] Check archive contents, source hashes and active links before removing the exact original checkout. Provide archive and validation report in chat outputs.
