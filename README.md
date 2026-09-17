# Echo / 回声 · Player feedback to reviewable action

**Echo** is an explainable player-feedback triage workspace for game operations and AI product practice. It converts a batch of comments into reviewable categories, keeps the original comments visible, and turns one selected issue into an experiment draft with metrics and guardrails.

> This is a working portfolio project, not a claim that AI has improved retention or revenue. The built-in comments are fictional. Any real feedback must be authorized, de-identified, and reviewed by a human.

## Why this exists

Game teams often receive many scattered comments after a version or event launch. A theme count alone is not a decision: a complaint may be duplicated, ironic, multi-topic, or missing device and version context. Echo makes the handoff explicit:

```text
feedback input → exact deduplication → explainable baseline → human review
               → original-text evidence → action hypothesis → metric + guardrail
```

The intended outcome is not “automatic decision making.” It is a smaller, auditable first step before a product or operations team decides whether to investigate, interview players, fix an issue, or run an experiment.

## What you can try

- Paste up to 200 feedback items (one per line), or use the two fictional scenarios.
- Inspect exact duplicate removal and the keyword-based category baseline.
- Review and correct a comment’s primary category; totals and action draft update immediately.
- Read the source comments supporting each topic instead of relying on a summary alone.
- Export a Markdown brief containing data scope, evidence, hypotheses, metric definitions, and limitations.
- Optionally run a **local-only** model agent. It can call two read-only tools: aggregate statistics and original-comment search. It cannot publish notices, change game settings, or create external tasks.

## Demo and local run

The repository contains a static demo designed for GitHub Pages. After publishing, its address is:

`https://<your-github-username>.github.io/echo-player-insights/`

For the full local experience, including the optional model agent:

```bash
node server.mjs
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). The project has no runtime npm dependencies; it requires Node.js 22 or newer.

```bash
npm test
```

The static Pages demo deliberately does **not** expose the local agent endpoint, so it never asks a visitor for an API key.

## Design choices and limits

| Choice | Reason | Limit |
| --- | --- | --- |
| Exact whitespace-normalized deduplication | Makes the count reproducible and avoids silently merging similar but different comments. | Does not detect semantic duplicates. |
| Keyword baseline with an `other` bucket | A reviewer can see why a category was assigned and correct it. | It is not semantic classification and has no accuracy evaluation. |
| One primary category per comment | Avoids inflating topic counts from a single message. | Multi-topic feedback must be reviewed by a human. |
| Original IDs in every brief | Makes claims traceable to the input batch. | A cited comment is still not evidence of population-level impact. |
| Metric + guardrail template | Makes the next step testable before action is taken. | It does not calculate sample size or prove causality. |

## Repository map

| Path | Purpose |
| --- | --- |
| `docs/` | Static, GitHub Pages-ready demo: interface, rules engine, and styles. |
| `agent.mjs` | Optional local model loop, read-only tool allowlist, evidence-ID checks, and token/round budgets. |
| `server.mjs` | Local loopback-only static server and model proxy. It never persists credentials. |
| `tests/core.test.mjs` | Offline automated tests for parsing, uncertainty handling, review updates, tool validation, and an agent mock loop. |
| `.github/workflows/` | Node test CI and GitHub Pages deployment workflow. |

## Privacy and model use

Do not commit an API key. Do not submit player IDs, contact details, payment information, private messages, or raw production logs. The optional local mode accepts the key in the browser for one request, sends it to the configured provider through the local service, and clears the input afterwards. It is still your responsibility to confirm that the data can be sent to that provider.

The default agent provider, endpoint, model, budgets, and timeout live together at the top of `agent.mjs`. A real model has not been used as a benchmark in this repository; the tests use mocked responses and do not establish model quality, latency, or cost.

## How to present this in an interview

Use a concrete, accurate description:

> I defined an explainable workflow for moving from version feedback to a reviewable operations hypothesis. I deliberately kept deterministic counts separate from model-written analysis, preserved original evidence, and designed human review, metric definitions, and guardrails into the prototype. The project is a prototype with fictional demo data, so I do not claim measured business impact.

This framing shows product judgment. It is stronger than presenting it as an “AI agent that automatically understands players.”

## Contributing

Small, testable improvements are welcome. Before opening a pull request, run `npm test`, avoid personal or proprietary data, and explain any behavior or copy change in the pull request description. See [SECURITY.md](SECURITY.md) for responsible disclosure and data-handling constraints.

## License

[MIT](LICENSE)
