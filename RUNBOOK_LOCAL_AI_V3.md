# Runbook: Generate Masu TodoList v3 with local model

## Input set
Feed the local model these files only:
- README.md
- index.html
- manifest.json
- sw.js
- AI_TASKPACK_V3.md
- LOCAL_AI_PROMPT_V3.txt

## Recommended execution pattern
Use 3 separate calls, not one giant call.

### Call 1
System/context:
- LOCAL_AI_PROMPT_V3.txt
User/context:
- README.md
- manifest.json
- sw.js
- first half of index.html
- second half of index.html
- AI_TASKPACK_V3.md
Task:
- Return STEP 1 JSON only.

### Call 2
Same context as call 1.
Task:
- Return STEP 2 JSON only.

### Call 3
Same context as call 1 plus the accepted STEP 1 and STEP 2 JSON.
Task:
- Return STEP 3 JSON only.

## Context budgeting for local 7B
- Keep each call under roughly 4k-5k input tokens.
- Split index.html into two chunks if needed.
- Do not add extra commentary.
- If output gets cut off, rerun only STEP 3 with a stricter instruction: fewer notes, full files first.

## Acceptance rule
Reject and rerun if:
- output is not valid JSON
- model adds frameworks
- model changes features
- model omits full contents for changed files
- model hallucinates missing files

## What to do with the result
After STEP 3 JSON is returned:
1. Extract changed_files[path, content]
2. Overwrite the corresponding files locally
3. Run manual checklist from the JSON
4. Only then consider commit/deploy
