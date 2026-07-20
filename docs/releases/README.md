# Release Records

This directory records release PR text and main-branch release merge messages so
future releases keep the same style.

Use these files when preparing a GitHub PR from `develop` or a hotfix branch
into `main`.

## Format

For `v0.6.1` release docs, release PRs usually included:

- `Summary`
- `Changes`

For `v0.7.0` and later, keep release PRs simpler: write one release title and
one release text block, then use the same text as the PR body and main release
commit body. Do not duplicate the same information into a long Changes section.

Do not include routine `Verification` or `Notes` sections unless the developer
explicitly asks or a release-blocking caveat must be visible in GitHub.

Older release files may include longer verification and notes blocks. Keep them
as historical records.

Main release merge commits should use:

```text
Release vX.Y.Z: concise release outcome

One or more paragraphs describing the release in plain English. Mention the
major feature groups, important infrastructure changes, stabilization work, and
documentation updates. Keep the body specific enough to be useful when reading
`git log` later.
```

## Files

- [v0.1.0.md](v0.1.0.md)
- [v0.2.0.md](v0.2.0.md)
- [v0.3.0.md](v0.3.0.md)
- [v0.4.0.md](v0.4.0.md)
- [v0.5.0.md](v0.5.0.md)
- [v0.5.1.md](v0.5.1.md): hotfix release record.
- [v0.6.0.md](v0.6.0.md)
- [v0.6.1.md](v0.6.1.md): patch release record.
- [v0.7.0.md](v0.7.0.md)
- [v0.7.1.md](v0.7.1.md): patch release record.
- [v0.8.0.md](v0.8.0.md)
- [v0.8.1.md](v0.8.1.md): patch release record.
- [v0.9.0.md](v0.9.0.md)
- [v0.10.0.md](v0.10.0.md)
- [v0.10.1.md](v0.10.1.md): patch release record.
- [v0.11.0.md](v0.11.0.md)
