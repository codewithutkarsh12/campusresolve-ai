# CampusResolve AI — Open Data Source Register

## Current state

No external dataset is currently ingested by the application. The incident queue, charts and audit events remain synthetic demo records stored in browser localStorage. Do not present them as verified campus statistics.

This register identifies candidate sources for future context features. It is not evidence that an integration is active.

## Candidate sources

| Source | Potential use | License / conditions | Integration status |
|---|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Optional campus-area map context and public roads/building footprints, after the campus boundary and data coverage are verified | Open Database License (ODbL). Provide visible attribution to OpenStreetMap and contributors; review share-alike obligations for derived databases. Public tile services have separate usage policies. | Not integrated |
| [Open Government Data Platform India](https://data.gov.in/) | Non-sensitive public context such as weather, public infrastructure or other relevant government datasets, only when a suitable dataset exists | Check the individual dataset's license metadata and terms. GODL-India permits broad reuse subject to its conditions, including source/provider attribution; not every linked third-party resource is automatically covered. | Not integrated |

## Acceptance checklist before importing any dataset

1. Confirm that the dataset is relevant to a real product decision—not just visual decoration.
2. Record the exact dataset URL, publisher, dataset identifier, license, attribution text, retrieval date and update frequency.
3. Verify the individual dataset license and any API/tile service terms; never infer a license from the host website alone.
4. Check freshness, completeness, geographic coverage, schema stability and whether the data is suitable for the intended use.
5. Keep public context data separate from private student reports and internal incident records.
6. Never import personal, confidential or sensitive student information into the demo.
7. Never use public context data to silently raise or lower an incident's safety priority. Human review and deterministic safety rules remain authoritative.
8. If a dataset becomes unavailable or stale, show its last-updated time and a clear unavailable state rather than fabricating values.

## Product guardrails

- Open data is context, not proof that an incident happened.
- Map data must not expose exact locations of sensitive reports.
- Any map must display the required attribution in a visible, readable location.
- Synthetic records must remain visibly labeled as synthetic.
- Adding a dataset requires a documented schema, license review, tests and a rollback path.
