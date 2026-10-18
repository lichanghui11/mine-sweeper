# Agent Framework and Model Attribution

Use this reference only when an Agent materially authored or changed content
included in a commit. A trailer records contribution; it is not a substitute
for reviewing the diff.

## Required identity

Attribute both:

1. the Agent framework or product performing the work; and
2. the fullest reliable identity of the model that framework is actively
   invoking.

Use this preferred shape:

```text
Co-Authored-By: <Agent framework> (<full active model identity>) <official email>
```

Omit the email when the vendor has not published one:

```text
Co-Authored-By: <Agent framework> (<full active model identity>)
```

The full model identity should include every reliably exposed component:

- model family and exact version, such as `GPT-5.6`;
- framework or deployment variant, such as `Sol`;
- active reasoning effort, thinking level, or execution mode, such as `High`.

Do not collapse a known identity like `GPT-5.6 Sol High` to `GPT-5`. If only
part of the identity is reliably available, include the known components and
report what was unavailable. Use the framework name alone only when no model
identity can be determined:

```text
Co-Authored-By: <Agent framework>
```

Framework-only attribution is a last resort.

## Resolve framework and model names

Use identity information in this order:

1. explicit user or repository attribution policy;
2. model, variant, and effort or mode exposed by the current runtime or
   session;
3. explicit model and effort selections in the Agent's active configuration or
   command;
4. vendor documentation or source for official product names and email
   addresses.

Record the model and execution profile actually used for the contribution, not
the framework's default. Preserve a vendor-supplied display name when
available. When runtime metadata uses machine-readable pieces such as
`gpt-5.6-sol` and `reasoning_effort=high`, combine them into a readable identity
without dropping information: `GPT-5.6 Sol High`.

If the runtime exposes only an alias, router, or `Auto` selection and does not
reveal the resolved model, record that exposed name rather than claiming an
underlying model.

Do not infer a model or effort level from a subscription tier, latency, output
style, or task difficulty. Do not copy identity from an earlier session. If
multiple frameworks, models, or execution profiles materially contributed, add
one trailer for each real combination.

## Framework conventions

Official vendor formats remain the source of trusted names and email
addresses. This skill extends them with explicit framework and model
provenance when the official default omits either field.

### OpenAI Codex

OpenAI's current default trailer identifies Codex but omits the model:

```text
Co-authored-by: Codex <noreply@openai.com>
```

For this skill, retain the official email and add the active model:

```text
Co-Authored-By: Codex (<full active model identity>) <noreply@openai.com>
```

Example when Codex reports `gpt-5.6-sol` with high reasoning effort:

```text
Co-Authored-By: Codex (GPT-5.6 Sol High) <noreply@openai.com>
```

Use the current runtime's actual complete identity. Do not automatically copy
this example into a different session.

### Anthropic Claude Code

Claude Code's official trailer already includes the active Claude model, but
labels the contributor as Claude:

```text
Co-Authored-By: Claude <active model name> <noreply@anthropic.com>
```

For this skill, make the framework boundary explicit:

```text
Co-Authored-By: Claude Code (<full active model identity>) <noreply@anthropic.com>
```

For example, if the runtime reports Claude Sonnet 5:

```text
Co-Authored-By: Claude Code (Claude Sonnet 5) <noreply@anthropic.com>
```

Claude Code supports customized or disabled attribution. Honor the effective
user or repository policy.

### GitHub Copilot coding agent

GitHub's hosted coding agent uses platform-level attribution: Copilot authors
the commit, the human who initiated the task is recorded as co-author, and the
commit links to session logs. GitHub does not publish an Agent co-author email
for this flow.

Preserve the hosted platform authorship. When commit-message customization is
available and policy permits, add model provenance without fabricating an
email:

```text
Co-Authored-By: GitHub Copilot (<full active model identity>)
```

### Other Agent frameworks

Use the framework's stable public name and the model exposed by its runtime:

```text
Co-Authored-By: Gemini CLI (<full active model identity>)
Co-Authored-By: Cursor Agent (<full active model identity>)
Co-Authored-By: Windsurf Cascade (<full active model identity>)
Co-Authored-By: Devin (<full active model identity>)
```

Replace the placeholder with the actual model version, variant, and effort or
mode that the runtime exposes. These frameworks do not have a confirmed vendor
co-author email in the sources used by this skill, so do not invent one.

An email-less value remains readable as a Git trailer but may not create a
linked co-author identity in hosting-provider UI. Prefer accurate,
non-fabricated provenance over a fake `noreply` address. If the repository
requires linked co-authors, ask the user for an approved identity.

## Contribution and formatting rules

- Follow explicit user and repository attribution policy.
- Add trailers only for Agents that materially authored or changed committed
  content, not Agents that only reviewed, staged, or committed existing human
  work.
- Put one blank line between the message body and the trailer block.
- Keep trailers at the end of the commit message.
- Preserve official framework, model, and email spelling while retaining every
  reliably known version, variant, and effort component.
- Do not duplicate an identical framework-model-profile combination.
- Keep multiple trailers on separate lines.
- Do not translate identity values or trailer keys to match the commit-message
  language.
- Do not rewrite an existing commit solely to add attribution unless the user
  asks.

Example:

```text
fix(parser): preserve comments after multiline values

Retain trailing comments while normalizing continuation lines.

Co-Authored-By: Codex (GPT-5.6 Sol High) <noreply@openai.com>
```

## Sources

Vendor behavior was checked on 2026-07-30:

- [Codex source: git attribution policy](https://github.com/openai/codex/blob/7d5253d2b07d48ae7e7bf15c535473b2d2024385/codex-rs/ext/git-attribution/src/world_state.rs)
- [Claude Code settings: attribution](https://code.claude.com/docs/en/settings#attribution-settings)
- [GitHub Docs: manage and track Copilot coding agent sessions](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)
- [GitHub Docs: create a commit with multiple authors](https://docs.github.com/en/pull-requests/how-tos/commit-changes/creating-a-commit-with-multiple-authors)
