# V1 Rollback Procedure

*Executed by whoever holds Netlify site access. Do not modify user data during rollback — Personal OS stores everything client-side.*

## Precondition

User data lives in each user's browser IndexedDB. Rolling back the app has no server-side data effect. The only risk is a **schema-migration mismatch**: if a rolled-back app version does not understand a schema the user's DB has already migrated to, the app will error on `openDB`. See "Schema mismatch handling" below.

## Fast rollback (Netlify one-click)

1. Open the Netlify site's **Deploys** tab.
2. Find the last known-good deploy (usually the entry just above the broken one).
3. Click **Publish deploy** on that entry.
4. Netlify serves the previous bundle immediately. The service worker will pick up the change on next revalidation; users will see the update prompt on their next visit.
5. Note the rollback in the team channel with the reason and the deploy IDs.

## Fast rollback (git revert path)

1. `git revert <bad-commit-sha>` on main.
2. Push.
3. Netlify deploys the reverted bundle automatically.
4. Same SW / user-side behaviour as the one-click path.

## Post-rollback verification

- [ ] Load the production URL — page loads without errors.
- [ ] DevTools → Application → Service Workers — a new SW picks up within one revalidation cycle.
- [ ] Users with the bad version open in a tab see the Update prompt.
- [ ] Existing users with data still see their mission / routine / notes intact.

## Schema mismatch handling

Every persisted entity carries a `schemaVersion` field, and the IndexedDB open path runs migrations from `oldVersion + 1` up to the compiled-in `DB_VERSION`. If the rolled-back bundle's `DB_VERSION` is lower than a user's already-upgraded DB, `openDB` will throw a `VersionError`.

**Guidance:**

- Rollbacks that do not cross a `DB_VERSION` boundary are safe.
- V1.0 ships at `DB_VERSION = 1`. Any future bump makes rollbacks across that boundary risky.
- If a bad deploy happened after a `DB_VERSION` bump, the user-safe recovery path is a **forward-fix**, not a rollback: ship a hotfix at the same `DB_VERSION` that repairs the specific bug. Rollback across a schema version can force users to Reset all data or Import from backup.

## Communication

For any rollback:

1. Post in the team channel: what broke, which deploy is now serving, and whether a hotfix is expected.
2. If any user reports data loss (unlikely — IndexedDB survives app-code changes), point them at **Settings → Reset all data** and their most recent backup file.

## Recovery for a user who cannot open the app after a bad deploy

1. Have them open **DevTools → Application → IndexedDB → personal-os** and confirm the DB exists.
2. If the DB is corrupted or the schema is unreadable, direct them to **DevTools → Application → Storage → Clear site data**, then reload. This is destructive.
3. Restore from their most recent JSON backup via the reloaded app's Settings → Backup & Restore.
