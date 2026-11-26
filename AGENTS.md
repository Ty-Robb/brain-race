# Brain Race (`MoBlockz/brain-race`)

Check edited JavaScript syntax before finishing:

```sh
node --check app.js && node --check audio.js && node --check content.js && node --check race.js
```

Static HTML/JS quiz + racing browser game (no build step). Verify year/subject selection, 80% unlock flow, and racing controls in a browser. Live site: `https://moblockz.github.io/brain-race/`.

## Rules

- **Kid-friendly & safe:** Kids (including a 9-year-old) build and playtest MoBlockz projects. Keep explanations plain and short; handle git and checks yourself instead of asking a kid to run terminal commands.
- **Safety defaults:** Browser games stay zero-ad, zero-login, and private room codes only for multiplayer. Minecraft Bedrock add-ons stay family-safe and remind players to back up worlds before installing.
- **Run checks once & report honestly:** Run the check command above once when done editing; do not re-run redundant full suites if passing, and never pass `--no-verify`. Report `Observed` vs. `Not run`.
- **Choose good compromises:** Prefer simple, direct solutions over speculative abstractions.
- **Multi-agent Git safety:** Never run `git add -A`, `git stash`, `git reset --hard`, or force-push. Stage explicit files. Never kill processes by name pattern.
- **Selective tests:** Prove behavior against the real game/pack; commit tests only where silent regressions are expensive. Keep local screenshots/logs in gitignored `.audit/` or `.qa/`.
- **Doc voice:** Plain, concise prose without filler; integrate doc edits instead of appending.
