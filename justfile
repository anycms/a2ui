dev:
    pnpm dev

# Bump versions (lockstep) + update CHANGELOG + git commit/tag/push.
# Interactive — prompts to confirm the recommended version bump.
release:
    pnpm release

# Preview the release without changing anything.
release-dry:
    pnpm release:dry

# Build all publishable packages and publish to npm.
# Run *after* `just release` once the version-tagged commit/tag is pushed.
publish:
    pnpm publish:npm
