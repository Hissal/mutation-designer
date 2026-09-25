# Mutation Designer

A local browser app for designing mutations for a body-horror roguelike FPS. Develop ideas, inspect their three states, compare offers, and share human-readable definitions with teammates.

## Run

Requires Node.js 22 or newer. There are no dependencies to install.

```sh
npm start
```

Open **http://127.0.0.1:4174/**. Stop the server with Ctrl+C. The server binds to this computer only; it does not publish your library or accept uploads over the network.

Keep using the same browser profile and URL. Local browser storage is specific to the origin: switching between `localhost` and `127.0.0.1`, or changing the port, opens a separate library. Changing `PORT` is supported when necessary, but export a JSON backup before switching origins.

The app starts empty. Create a mutation, import a JSON file, or explicitly load the illustrative sample ideas.

## Design and compare

- One definition has a name, optional effect titles, positive and negative free-text effects, bodily-change text, notes, tags, a workflow status, and a visual.
- **Stable** shows the positive effect. **Unstable** shows both. **Corrupt** shows the negative effect. Volatile is not included.
- Workflow labels are **Idea, Developing, Ready, Archived**. Incomplete ideas can always be saved.
- Cards are the default library view. Switch to a list and choose small, medium, or large entries.
- Use any of 12 built-in anatomy icons or upload one PNG/JPEG/WebP/GIF up to 5 MB. Switching to an icon keeps the upload available.
- State previews and comparison offers have independent side-by-side / stacked controls.
- The editor and preview always size automatically, separated by a slim line. Full preview content stays visible. Very long previews grow the panel; mobile uses natural page height.
- The comparison lab has three slots with state selectors and locks. Reroll mutations only, or mutations and states. Current search/tag/workflow filters determine the pool. Archived ideas are excluded by default; locks survive filtering. Small pools leave unfillable slots empty.

## Save, back up, and exchange files

Definitions, uploaded images, and layout preferences autosave in IndexedDB. **Saved locally** appears only after the browser confirms the write. Failed writes show **Not saved**, a retry action, and a backup action. Unsaved edits remain in memory so you can export them. Leaving with pending edits triggers the browser's unsaved-changes prompt when supported.

Only one tab can edit this library at a time. Additional tabs open read-only to prevent stale copies overwriting newer edits. Close the editing tab and reload the other tab to take over. Read-only tabs can still export the version they loaded; reload to get the latest saved version.

Use **Export / backup**, the editor's **Export**, or library checkboxes and **Export selected**:

- **JSON** preserves IDs, timestamps, complete definitions, anatomy icon choice, visual source, notes, and embedded images. Full-library export includes archived definitions. This is the importable backup format.
- **Markdown** provides human-readable definitions and effects. Shared state rules are not repeated in each definition. Images are omitted. Design notes can be included or excluded.

Import JSON to review new, unchanged, and conflicting definitions before applying anything. For each changed existing ID, compare both versions and choose **keep yours**, **replace yours**, or **import as a separate copy**. Invalid files leave the current library unchanged. The supported envelope is `format: "mutation-designer"`, `schemaVersion: 1`, and a `mutations` array; use an exported file as the complete schema example.

Archive is reversible. Permanent deletion is available for archived definitions and requires confirmation. Export a backup if you may want to restore them later.

Browser data can be cleared or evicted, and private browsing sessions may discard it. Keep periodic full-library JSON backups. There is no shared server, cross-device sync, or revision history.

## Development and checks

```sh
npm test
```

The Node tests cover JSON integrity and validation, all import-conflict decisions, Markdown note exclusion, state rules, independent duplicate identities, reroll invariants, archive filtering, and save-queue ordering/retry behavior.

Additional Chrome verification covered real IndexedDB persistence across reload, image persistence, preferences, JSON/Markdown downloads, all conflict choices, selected exports, archive/delete/cancel behavior, invalid imports, empty libraries, read-only secondary tabs, mobile layout, simulated quota failure/recovery, and protection of unsupported saved data.

Source boundaries:

- `app/model.js`: definitions, validation, file exchange and reroll rules.
- `app/storage.js`: IndexedDB transactions, save queue and editing lock.
- `app/view.js`: approved A presentation.
- `app/controller.js`: editing, saving, dialogs and interactions.
- `server.mjs`: local static-file server with an explicit asset allowlist.

## Prototype and design agreement

The approved direction is recorded in [the design brief](docs/design-brief.md). The complete prototype remains on branch `prototype/designer-variants`, last refined at `af69fc6`. Main contains the chosen app; the old layout switcher and discarded B/C layouts are not shipped.

Prototype tabs on port 4173 contain temporary session data. Their edits cannot automatically transfer to this app because the prototype intentionally had no storage or export. Keep any such tab open while manually transferring ideas you want to preserve.

## Vendored skills

38 Matt Pocock skills and their supporting files are in `.agents/skills`, including upstream in-progress skills.

- Source: https://github.com/mattpocock/skills
- Pinned revision: `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`
- Retrieved: 2026-09-25
- License: `.agents/skills/LICENSE.mattpocock` (MIT)

Git is local; no hosted repository or remote is configured.
