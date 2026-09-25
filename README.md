# Mutation Designer

A local browser app for designing mutations for a body-horror roguelike FPS. Develop ideas, inspect their three states, compare offers, and share human-readable definitions with teammates.

## Use on GitHub Pages

Open [Mutation Designer](https://hissal.github.io/mutation-designer/) in your browser. Source: [Hissal/mutation-designer](https://github.com/Hissal/mutation-designer).

The app can be hosted on GitHub Pages. Visitors open the site in their browser without downloading the app or installing Node.js. Definitions and images stay in that browser's local storage; hosting does not introduce shared saving or upload definitions to the repository.

To publish:

1. Push this repository to your chosen GitHub repository, with `main` as the branch.
2. In the repository's **Settings > Pages**, select **GitHub Actions** as the build and deployment source.
3. Run **Deploy GitHub Pages** from the Actions tab, or push a change to `main`. The workflow tests the app and publishes only its static assets.
4. Open the deployment URL shown by GitHub, normally `https://OWNER.github.io/REPOSITORY/`.

The Pages library and local launcher's library are separate. Use JSON export/import to transfer definitions between them. Each teammate also has their own browser library.

For a local copy, run `git clone https://github.com/Hissal/mutation-designer.git` (GitHub Desktop works too), then double-click `launch-mutation-designer.cmd`. Pull updates to refresh the app files. Saved definitions live outside the repository and are not part of Git commits.

`npm run build:pages` prepares the static site in `pages-site/`. The Node.js server and Windows launcher are needed only for local use.

## Launch on Windows

Google Chrome or Microsoft Edge is required. The launcher checks for Node.js 22 or newer. If it is missing or too old, it offers to install Node.js LTS through Windows Package Manager: type **Y** to install or **N** to exit. Windows may ask for administrator permission. After a successful installation, the app launches automatically. If Windows Package Manager is unavailable or installation fails, the launcher provides manual installation instructions at https://nodejs.org/. No npm package installation is needed.

Double-click **launch-mutation-designer.cmd**. It starts the local server if necessary, then opens a dedicated browser app window without tabs or an address bar. You can make a desktop shortcut to this file. The launcher works regardless of the terminal's current folder.

The launcher closes after a successful start. A server it starts runs hidden in the background and remains available after the app window closes, until the computer restarts or that server process is stopped. Launching again reuses the running server. If you started the server manually in a terminal, keep that terminal open.

The address stays fixed at **http://127.0.0.1:4174/**. If another application occupies the port, the launcher reports the conflict instead of changing ports and appearing to lose your library.

The app window uses its own browser profile at `%LOCALAPPDATA%\MutationDesigner\browser-profile`. This keeps its library separate from normal browsing and preserves it when the application folder is moved or updated. The launcher remembers its chosen browser in `launcher.json` in the same parent folder. Server output goes to `server.log` there.

**One-time transfer from the existing browser version:** export a full-library JSON backup in your current browser, open the new app window, and import that JSON. The new profile initially has an empty library; your original browser data remains in place.

## Share with teammates

Send the application ZIP. Teammates extract it, ensure Chrome/Edge is installed, and double-click **launch-mutation-designer.cmd**. The launcher can help install Node.js on first launch. Send mutation JSON files separately if they need your definitions. No account or shared server is required.

To produce a clean ZIP from the committed version:

```powershell
git archive --format=zip --output=mutation-designer.zip HEAD app server.mjs launch.mjs bootstrap.ps1 launch-mutation-designer.cmd build-pages.mjs package.json README.md docs tests
```

The ZIP contains the app, not personal browser data. Each teammate gets their own local library.

## Run in a regular browser

```sh
npm start
```

Open **http://127.0.0.1:4174/**. Keep the terminal open and press Ctrl+C to stop this manually started server. The server binds only to this computer.

Regular browsers use their own profile's storage. Use the same profile and exact URL each time: `localhost`, `127.0.0.1`, and different ports are separate origins. JSON export/import transfers libraries between them. The Windows launcher always uses port 4174, even if `PORT` is configured for manual use.

For launcher diagnostics without opening a window, run `node launch.mjs --check`.

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

The Node tests cover the Node.js installation consent/decline and failure paths with mocked installers, launcher arguments, server detection/reuse, port conflicts, startup readiness/timeouts, JSON integrity and validation, all import-conflict decisions, Markdown note exclusion, state rules, independent duplicate identities, reroll invariants, archive filtering, and save-queue ordering/retry behavior.

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

Public repository: https://github.com/Hissal/mutation-designer. The `origin` remote points to this repository.
