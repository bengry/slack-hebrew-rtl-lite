# Rewrite or evolve

Type: grilling
Status: resolved
Blocked by: 02, 03, 04, 05, 09

## Question

Rewrite the content script and stylesheet from scratch around the per-paragraph model, or evolve the current code? Depends on the rendering mechanism, the direction rule, whether chrome mirroring survives, and the v1 surfaces.

## Answer

Rewrite the content script and stylesheet from scratch. Dropping chrome mirroring, moving to per-container direction, and the new surfaces leave little of the current code worth keeping.
