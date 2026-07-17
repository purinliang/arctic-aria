# Release Records

This directory records release PR text and main-branch release merge messages so
future releases keep the same style.

Use these files when preparing a GitHub PR from `develop` or a hotfix branch
into `main`.

## Format

For `v0.6.1` and later, release PRs should usually include:

- `Summary`
- `Changes`

Keep the PR text concise. Do not include routine `Verification` or `Notes`
sections unless the developer explicitly asks or a release-blocking caveat must
be visible in GitHub.

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
