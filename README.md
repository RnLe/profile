# Portfolio site

Personal research portfolio of Rene-Marcel Lehner: a quiet, evidence-first
research profile and curriculum vitae, built with
[Astro](https://astro.build). Static output, deployed to GitHub Pages at
[rnle.github.io/profile](https://rnle.github.io/profile/); deployment itself
stays a manual gate.

The site is built around honesty as architecture: typed content collections,
a claim registry (every measured or comparative statement carries its scope
and comparator), versioned document records with checksums, and a fail-closed
publication pipeline: anything not explicitly approved cannot reach the
build.

## Requirements

- Node.js >= 22.12
- pnpm 10 (pinned via `packageManager`)

## Development

```bash
pnpm install
pnpm exec playwright install chromium   # once, for e2e/a11y tests

pnpm go            # build + serve the production site locally
pnpm dev           # dev server with hot reload

pnpm verify        # the full core gate: types, unit tests, registry
                   # validators, build, HTML validity, e2e, a11y, links,
                   # budgets, and production-artifact inspection
pnpm verify:release# additionally blocks on placeholders, visual tests,
                   # Lighthouse, and external links
```

`pnpm build` always runs `prepare:public` first: the public directory is
regenerated from an audited, checksum-verified allowlist on every build.

## Content model

- `src/content/projects/*.md`: research case studies (schema-validated
  frontmatter: lifecycle, evidence level, status date, claims, figures).
- `src/data/about.ts`: curriculum-vitae entries and their artifact links.
  Only links marked `state: 'live'` render, so an artifact still sitting in a
  private repository can be recorded now and published later.
- `src/data/claims.yaml` · `artifacts.yaml` · `media.yaml` ·
  `public-project-registry.yaml`: the four registries. `src/lib/publication.ts`
  resolves what may render; everything else consumes its output.

## Deployment

Manual only: run the **Deploy site** workflow from the Actions tab. It
verifies the site at the site root, rebuilds it with the project-page path
prefix (`SITE_BASE=/profile/`), re-checks that artifact (HTML validity,
internal links, release-mode inspection, where a remaining placeholder blocks
the deploy), uploads it, deploys, and smoke-tests the URL. Nothing is
published on push.

Deploying at a different path, or at the site root, is one variable:
`SITE_BASE` in `.github/workflows/pages.yml`. Every internal link is built
through `withBase`, and the artifact checkers strip the prefix before they
compare route sets.

## Working material

Private folders (`documents/`, `material/`, `thesis/`) and local notes are
deliberately never committed. The one exception is
`material/publication-source/`, where the documents the site actually
publishes live: those are allowlisted by name in `.gitignore`, because the
build needs them. Everything else under `material/` stays ignored by default.

To move the private folders between machines:

```bash
make pack     # here      -> profile-material.tar.gz
make unpack   # there     <- profile-material.tar.gz
```

Copy the archive across manually; it is git-ignored and must stay that way.
