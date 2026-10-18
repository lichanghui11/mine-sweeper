---
name: atomic-commits
description: Apply an atomic Git commit standard whenever an agent changes repository files, prepares or performs commits, reviews a dirty worktree, or encounters a large mixed commit. Use proactively during coding so changes remain separable, and when asked to commit, split or rewrite commits, or decide which files should remain uncommitted.
---

# Atomic Commits

## Follow the core standard

Create the smallest coherent commit that is independently understandable,
reviewable, and revertible while leaving the repository in a valid state.
Atomic means one complete intent, not the fewest possible lines or files.

- Group changes by one intent, not merely by file type.
- Keep implementation with the tests, migrations, generated outputs, or
  documentation required to make that implementation valid.
- Separate independent behavior, unrelated cleanup, formatting, dependency
  updates, and incidental fixes.
- Do not split tightly coupled changes just to minimize file count.
- Preserve user-authored changes and existing repository state.
- Treat reading this skill as guidance, not authorization to create commits,
  rewrite history, delete files, discard changes, or push.

Maintain these boundaries while editing. Avoid accumulating unrelated changes
and postponing all separation until commit time.

## Inspect repository context

Before planning or creating commits:

1. Read repository instructions that govern Git, validation, generated files,
   and commit messages.
2. Inspect the complete worktree, including staged, unstaged, and untracked
   paths.
3. Read recent history to learn the project's language and message convention.
4. Distinguish changes produced in the current task from pre-existing or
   user-owned changes.

Use commands such as:

```bash
git status --short --branch
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git ls-files --others --exclude-standard
git log -12 --format='%h %s'
```

Inspect untracked files safely before staging them. Do not print secrets merely
to classify a file.

## Stop and discuss questionable files

Do not silently include a file when there is a credible reason it may not
belong in version control. Discuss exact paths with the user and recommend one
of: commit, leave uncommitted, add an ignore rule, or investigate further.

Treat these as warning signs:

- credentials, tokens, private keys, certificates, `.env` files, or secret
  exports;
- build products, caches, logs, coverage, downloaded dependencies, database
  dumps, recordings, or large binary/data files;
- local editor, operating-system, machine, account, or workspace configuration;
- scratch files, debug helpers, one-off scripts, backups, or temporary plans;
- unexpected generated files or generated files without their source change;
- unrelated or pre-existing modifications, surprising deletions, and files
  whose ownership or purpose is unclear.

Do not stage, restore, delete, or add ignore rules for questionable paths until
their disposition is resolved. If safe commits can proceed while those paths
remain untouched, keep them uncommitted and report them explicitly.

## Design the commit plan

Map each proposed commit to:

- one purpose;
- exact files or hunks;
- prerequisites and ordering;
- validation that demonstrates the commit is sound;
- a draft subject matching repository history.

Prefer a dependency order in which foundational changes precede their
consumers. Each intermediate commit should build and test when reasonably
possible. If a file contains multiple intents, split it by hunk rather than
forcing the entire file into one commit.

Tests do not automatically belong in a separate `test` commit. Keep regression
tests with the fix or feature they validate unless the tests are independently
valuable. Apply the same reasoning to documentation, schemas, migrations,
lockfiles, snapshots, and generated code.

Explain the plan before committing when the grouping is ambiguous, a staged
boundary must be changed, or any files may intentionally remain uncommitted.

## Stage and verify one unit at a time

Stage explicit paths or hunks. Avoid broad commands such as `git add .`,
`git add -A`, or `git commit -a` when the worktree contains mixed or
questionable changes.

For every commit:

1. Stage only the intended paths or hunks.
2. Review `git diff --cached --stat` and `git diff --cached`.
3. Run `git diff --cached --check`.
4. Run the narrowest meaningful validation required by the repository.
5. Confirm that no user-owned or unrelated hunk entered the index.
6. Create the commit only when the user has authorized committing.
7. Re-read `git status --short` before moving to the next unit.

When a hook fails, inspect its output and the worktree again because hooks may
modify files. Fix only in-scope issues, restage intentionally, and retry. Do not
use `--amend` after a failed commit attempt unless a commit was actually
created and amending it is intended.

## Split a large dirty worktree

When many files are uncommitted:

1. Inventory all staged, unstaged, and untracked changes.
2. Resolve questionable-file disposition with the user.
3. Build intent-based groups, including hunk-level splits where necessary.
4. Preserve unrelated and user-owned changes outside the index.
5. Stage, verify, validate, and commit one group at a time.
6. Finish with a status report that names every remaining change.

Do not assume that the existing staged set is a correct commit boundary. Do not
use a temporary stash as a disposable safety net for state that belongs to the
user.

## Split an existing oversized commit

History rewriting requires explicit authorization.

1. Identify the exact target commit and whether it has been pushed, shared, or
   followed by other commits.
2. Inspect the worktree first. Do not mix dirty worktree changes into the
   rewrite.
3. Present the intended replacement commits and any questionable files.
4. Prefer follow-up commits for published history unless the user explicitly
   accepts a rewrite and any required force push.
5. Before rewriting, record the original commit ID and create a recoverable
   backup ref.
6. For a local tip commit, reset to its parent only after the target and backup
   are verified, then reconstruct the planned commits from the resulting
   changes.
7. For an older, merge, or shared commit, choose a history-aware procedure
   rather than treating it like a local tip.
8. Compare the reconstructed final tree with the original tree and rerun
   validation.

Never force-push merely because commits were split. Keep the backup ref until
the user confirms the rewritten history is accepted.

## Match the project's commit-message convention

Infer the convention from repository instructions and recent relevant history:

- Match the project's usual language. Do not force English.
- Match its capitalization, scopes, prefixes, emoji, title length, and body
  style.
- Use Conventional Commits only when the repository uses or requests them.
- Describe the intent in the subject and use the body for motivation,
  constraints, or non-obvious consequences.
- Preserve required issue, breaking-change, sign-off, and other trailers.

When history is mixed and no instruction resolves it, follow the dominant
recent convention in the affected area, then the language used by the user for
the task.

## Do not attribute Agent authorship

Never add `Co-Authored-By`, `Co-authored-by`, or any other trailer that names
an Agent, model, or coding tool as a commit author or co-author. Never set
`GIT_AUTHOR_*` or `GIT_COMMITTER_*` to an Agent identity. Commits must use
only the repository's human Git user. Do not create or restore
`references/agent-co-authors.md`.

## Report the result

After committing or splitting, report:

- each new commit ID and subject;
- the intent and notable paths in each commit;
- validation performed and any failures;
- every path intentionally left uncommitted and why;
- any backup ref or history rewrite still requiring user action;
- whether anything was pushed.
