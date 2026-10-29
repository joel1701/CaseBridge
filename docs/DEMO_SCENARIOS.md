# Synthetic demo scenarios

All allegations and institutions are synthetic. Intelligence and action APIs are implemented; the complete UI and teammate-owned authentication workflows still require integration. See `JOEL_INTEGRATION.md` for verified behavior and limitations. IDs refer to `data/` fixtures.

| Scenario                            | Records                               | Expected outcome                                                                                                                        |
| ----------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Related fee complaints              | cmp-001 (PGRC), cmp-002 (RB), inst-01 | Explain common institution and fee allegation despite different wording; authorized human confirms/rejects.                             |
| Unrelated same institution          | cmp-001 and cmp-003                   | Roof infrastructure issue remains separate from fees; no link solely because institution matches.                                       |
| Similar text, different institution | cmp-001 and cmp-006                   | Do not confirm a link based on text alone.                                                                                              |
| Duplicate evidence                  | act-001 and act-002                   | Preview warns that fee ledgers overlap; officer coordinates a shared request rather than issuing redundant requests.                    |
| Potential conflicting workflow      | cmp-004 / cmp-005 and act-004         | Existing staffing inspection is considered before issuing another notice; warn and record rationale, never auto-block a legal decision. |
| Cross-bureau coordination           | link-demo-001                         | Bureau heads agree evidence sharing or joint work; a CoordinationDecision records actor/type/rationale and history.                     |

Final outcomes: original IDs and bureau owners remain intact, lifecycle statuses remain independent, review states reflect human work, actions have attributable decisions, and restricted descriptions are never disclosed via graph/link/count APIs. Known pairs include positive/negative examples for precision/recall evaluation; small synthetic data cannot establish production model quality.
