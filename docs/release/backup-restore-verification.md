# V1 Backup / Restore Verification Checklist

*Run before every production deploy. Confirms the Import/Export flow round-trips user data losslessly.*

## Setup

Use a browser profile / private window with an empty IndexedDB so bootstrap data appears predictably.

## Export

1. [ ] Open the app. Bootstrap example data loads (Today shows the example mission).
2. [ ] Navigate to Today → create your own contract → complete a real mission (e.g. "Verification run", 7 days, any why).
3. [ ] Build a small routine (2–3 blocks).
4. [ ] Complete one block on Today (writes DayLog + PromiseEvent + updates snapshot).
5. [ ] Create a note in Knowledge Vault with a tag.
6. [ ] Save a Daily review with at least one prompt answered.
7. [ ] Open Settings → Backup & Restore → Export.
8. [ ] A file downloads named `personal-os-backup-<today>.json`.
9. [ ] Open the file in a text editor.
   - [ ] Top-level fields: `schemaVersion` = 1, `appVersion` matches the deployed build, `exportedAt` is a valid ISO timestamp.
   - [ ] `data` block has all eight store keys: `missions`, `routines`, `dayLogs`, `promiseEvents`, `snapshots`, `notes`, `reviews`, `settings`.
   - [ ] Each expected record appears at least once (mission, routine, dayLog, promiseEvent, snapshot, note, review).
10. [ ] Record the file size and per-store counts for the "restore identity" check below.

## Restore into a fresh state

1. [ ] Open DevTools → Application → IndexedDB → delete the `personal-os` DB.
2. [ ] Reload the app. Bootstrap example data appears again.
3. [ ] Open Settings → Backup & Restore → Restore from backup → pick the file from the Export step.
4. [ ] Preview panel shows the correct counts + exported-date + schema-version + app-version.
5. [ ] Click **Replace all data**.
6. [ ] Page reloads.
7. [ ] Bootstrap is gone; the mission from the Export step is active.
8. [ ] Today shows the routine you built; Progress reflects the block you completed.
9. [ ] Knowledge Vault shows the note (title, body, tag intact).
10. [ ] Analytics Self-Trust score matches what the Export was showing (snapshot came through).
11. [ ] Analytics Reviews → the Daily review shows Submitted status; opening it shows the same answers.
12. [ ] Storage stats in Settings → About match the per-store counts noted during Export.

## Restore into an in-use state

1. [ ] Without deleting the DB, create additional content (a new note, a new mission draft).
2. [ ] Restore the earlier backup file.
3. [ ] Preview shows the backup's counts (not the current in-memory counts).
4. [ ] Click **Replace all data**.
5. [ ] After reload, the newly created content is gone (replace-all semantics as documented).
6. [ ] The backup's content is intact.

## Negative-path checks

- [ ] Try to import a plaintext (non-JSON) file — validation error surfaces below the file picker; no writes happen.
- [ ] Try to import a JSON file with a wrong `schemaVersion` — validation error explains the mismatch.
- [ ] Try to import a JSON file missing one of the eight `data` keys — validation error names the missing key.

## Post-verification

- [ ] Reset your test browser profile back to empty (Settings → Danger zone → Reset all data, or clear site data).
- [ ] Note the verification pass in the release channel.
