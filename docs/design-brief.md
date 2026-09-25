# Mutation Designer - approved design

The user approved the refined A design after comparing three interactive variants. The prototype is preserved on `prototype/designer-variants` at `af69fc6`; the local saved application is implemented on main.

## Scope

A design and writing workspace for mutation ideas in a body-horror roguelike FPS, not a runtime mutation authoring system. Team members work in their own browsers and exchange files. Shared storage and live collaboration are outside this version.

Each mutation has one name and one definition. Positive and negative effects each have an optional short title and free-text description. Stable shows only the positive; Unstable shows both; Corrupt shows only the negative. No state-specific overrides. Volatile, formerly Rampant, is excluded. Written rules take precedence over labels and effects in the supplied picker screenshot.

Also capture optional bodily change, design notes, flexible tags, one uploaded reference image, selected body icon and visual source, and workflow: Idea, Developing, Ready, Archived. Allow incomplete definitions. Readiness is a human judgment, not a validation gate.

## Approved interface

Keep A's game-inspired atmosphere, blood-red and acid-green identity, serif headings, and large visual cards. Cyan may be used sparingly. State labels always accompany colors. Current exploratory mapping: Stable green, Unstable amber, Corrupt red.

Cards are the library default; provide a denser list with both effects, and small/medium/large entry sizes. Search and workflow/tag filters define both the library view and eligible reroll pool. Exclude Archived by default.

Show the selected definition in all three states, with side-by-side and stacked choices. Comparison offers have an independent layout choice. Stacked offers are slim horizontal rows on desktop: artwork left, effects center, controls right. Long descriptions wrap without truncation.

Sizing is always automatic: reserve the natural height of the full preview and give the editor remaining space. Long content grows the overall panel. A slim static line separates the sections. There is no manual resizing or auto-fit toggle; obsolete saved resize preferences are ignored. Mobile uses natural content height.

Offer 12 locally authored anatomy outlines: bones, heart, lungs, eye, spine, teeth, brain, skull, hand, stomach, muscle, skin. Switching to an icon retains the uploaded image for later reuse. Chosen visuals appear in library entries, state previews, and comparison offers.

## Comparison rules

Three slots with mutation and state selection. Locks preserve both identity and state, even when the item falls outside filters. Reroll mutations only (preserve states), or both mutations and states. Do not duplicate mutations within a roll. Avoid each unlocked slot's previous mutation when a distinct assignment permits it. Leave unfillable slots empty if the pool is too small. Include incomplete ideas. This is a design experiment, not a simulation of game offering probabilities.

## Saving and exchange

Save definitions, images and layout preferences locally, with explicit saved/error feedback. No shared storage or revision history. Archive is the routine reversible removal action; permanent deletion requires confirmation.

Markdown is framed as a human-readable format: current definition or selected group, body, effects and optional design notes, without images. Omit the repeated states table because every mutation uses the same rules. JSON exports preserve complete editable definitions and embedded images; full-library backup includes archived records. Stable IDs identify matches. Conflicting imports show both versions and require keep, replace or separate-copy choices. Never silently overwrite changes.

The implementation adds a single-editor browser lock to prevent competing tabs overwriting the local library. Secondary tabs remain useful for reading and exporting their loaded snapshot. New installations start empty; illustrative examples are explicitly opt-in.

## Validation

11 automated Node tests exercise data integrity, imports and their conflict decisions, Markdown exports, states, copies, rerolls and save ordering/failure recovery. Chrome interaction checks verify the real storage and file workflows, state/presentation controls, multi-tab behavior, deletion, invalid imports, persistence, mobile layouts, storage errors/retry, and safe handling of unsupported saved data.


Stacked state previews use compact rows with smaller icons and inline effect titles, matching the density of stacked comparison offers. Application-owned visible copy uses no em dashes. User-authored definitions are preserved verbatim.
