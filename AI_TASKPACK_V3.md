# Masu TodoList v3 - Local AI Task Pack

## Mission
Refactor `masu-todolist` into **v3** with better maintainability while preserving current behavior.
Do **not** add new features unless explicitly requested.
Do **not** migrate to React/Vue/TypeScript.
Do **not** introduce build tools.
Keep it static and deployable to GitHub Pages.

## Hard Rules
1. You must reason from the provided files only.
2. If context is insufficient, say `UNKNOWN` in JSON instead of guessing.
3. All outputs must be valid JSON.
4. Preserve all existing user-visible features.
5. Prefer small, reviewable refactors.
6. For code-generation steps, output full file contents only for files that changed.
7. Keep naming simple and human-maintainable.

## Current Files
- index.html
- manifest.json
- sw.js
- README.md

## Existing Features To Preserve
- Add todo
- Toggle complete / incomplete
- Delete todo
- Filter: all / active / done
- Keyword search
- Priority: low / medium / high
- Due date
- JSON export / import
- Drag and drop reorder
- localStorage persistence
- PWA manifest + service worker registration

## v3 Refactor Goal
Target structure:
- index.html
- styles.css
- app.js
- manifest.json
- sw.js
- README.md

Do not split further in this round.

## Success Criteria
- Same functionality as v2
- CSS extracted from inline `<style>` into `styles.css`
- JavaScript extracted from inline `<script>` into `app.js`
- `index.html` becomes mostly structure + asset links
- Service worker and manifest still work
- README updated to describe v3 structure
- No framework added

## Required Workflow
You must complete the following steps in order.

### STEP 1 - Analyze only
Output JSON only:
```json
{
  "step": 1,
  "project_summary": "",
  "preserve_features": [],
  "refactor_plan": [],
  "risks": [],
  "unknowns": []
}
```

### STEP 2 - Produce file map only
Output JSON only:
```json
{
  "step": 2,
  "target_files": [
    {"path": "index.html", "responsibility": []},
    {"path": "styles.css", "responsibility": []},
    {"path": "app.js", "responsibility": []},
    {"path": "manifest.json", "responsibility": []},
    {"path": "sw.js", "responsibility": []},
    {"path": "README.md", "responsibility": []}
  ],
  "must_not_change": [],
  "unknowns": []
}
```

### STEP 3 - Generate v3 files
Output JSON only:
```json
{
  "step": 3,
  "changed_files": [
    {"path": "index.html", "content": "..."},
    {"path": "styles.css", "content": "..."},
    {"path": "app.js", "content": "..."},
    {"path": "README.md", "content": "..."}
  ],
  "unchanged_files": ["manifest.json", "sw.js"],
  "preserved_features": [],
  "manual_test_cases": [],
  "risks": []
}
```

## Constraints For Local 7B Model
- Do not rewrite manifest.json unless necessary.
- Do not rewrite sw.js unless necessary.
- Focus on extraction and cleanup, not redesign.
- Keep DOM ids and behavior compatible where possible.
- Keep storage key compatible unless there is a strong reason to version bump.

## Manual Test Checklist
Include these in `manual_test_cases`:
- Add a todo
- Toggle complete
- Delete todo
- Filter all/active/done
- Search keyword
- Set priority
- Set due date
- Export JSON
- Import JSON
- Drag reorder
- Reload page and confirm persistence
- Confirm service worker still registers

## Failure Policy
If you cannot safely complete STEP 3, output JSON:
```json
{
  "step": 3,
  "status": "BLOCKED",
  "reason": "",
  "smallest_safe_next_action": ""
}
```
