# 11: Review moderation and audit

**What to build:** An administrator can find and moderate reviews while review authorship remains absent from ordinary moderation screens and authored content cannot be rewritten.

Blocked by: 02 Owner and administrator access

Status: ready-for-agent

- [ ] The administrator dashboard can search reviews and inspect visible, hidden, removed, and author-withdrawn states without routinely displaying author ID or email.
- [ ] Administrators can hide, restore, or remove a review with a required reason; each transition records actor, reason, time, and prior/new state in an append-only audit record.
- [ ] Hidden and removed reviews disappear from shared reads; restoring a withdrawn review does not make it public until its author republishes.
- [ ] Administrators cannot change review rating or text, permanently erase a review through the normal dashboard, or read individual timetables.
- [ ] Automated tests cover each state transition, reason validation, audit integrity, and denied ordinary-user and administrator actions.
