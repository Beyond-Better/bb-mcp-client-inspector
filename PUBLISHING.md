# Publishing Guide

This document explains how the MCP Client Inspector is published to JSR and how to create new releases.

## Package Structure

The project is published as a single JSR package with multiple entry points:

```jsonc
// deno.jsonc
{
  "name": "@beyondbetter/mcp-client-inspector",
  "version": "1.0.0",
  "exports": {
    ".": "./main.ts",                    // Run both components
    "./mcp-server": "./mcp-server/main.ts", // Run MCP server only
    "./fresh-ui": "./fresh-ui/main.ts"     // Run Fresh UI only
  }
}
```

This allows users to:
- `deno run jsr:@beyondbetter/mcp-client-inspector` - Run both
- `deno run jsr:@beyondbetter/mcp-client-inspector/mcp-server` - MCP server only
- `deno run jsr:@beyondbetter/mcp-client-inspector/fresh-ui` - Fresh UI only

## Automated Publishing

Publishing to JSR is automated via GitHub Actions.

### Workflow Files

#### Test Workflow (`.github/workflows/test.yaml`)

Runs on every push and pull request to `main` and `develop` branches:

1. **Formatting check** - `deno fmt --check`
2. **Linting** - `deno lint`
3. **Type checking** - `deno task check`
4. **Tests** - `deno task test`
5. **Coverage** - Generates and uploads to Codecov

#### Publish Workflow (`.github/workflows/publish.yaml`)

Publishes to JSR when triggered by:

1. **Git tag** matching pattern `v*.*.*` (e.g., `v1.0.0`)
2. **Manual dispatch** with version input

Publishing steps:

1. **Formatting check** - `deno fmt --check`
2. **Linting** - `deno lint`
3. **Type checking** - `deno task check`
4. **Tests** - `deno task test`
5. **Version update** - Updates `deno.jsonc` with release version
6. **Publish** - `deno publish --allow-dirty`

## Creating a Release

### Method 1: Git Tag (Recommended)

1. **Update version locally** (optional, workflow will do this):
   ```bash
   # Edit deno.jsonc and set version to "1.0.1"
   git commit -am "Bump version to 1.0.1"
   ```

2. **Create and push tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **Monitor workflow**:
   - Go to GitHub Actions tab
   - Watch the "Publish to JSR" workflow
   - Verify successful completion

4. **Verify on JSR**:
   - Visit https://jsr.io/@beyondbetter/mcp-client-inspector
   - Confirm new version is available

### Method 2: Manual Dispatch

1. **Go to GitHub Actions**:
   - Navigate to your repository on GitHub
   - Click "Actions" tab
   - Select "Publish to JSR" workflow

2. **Run workflow**:
   - Click "Run workflow" button
   - Enter version number (e.g., `1.0.1`)
   - Click "Run workflow"

3. **Monitor and verify** as in Method 1

## Version Management

The project uses semantic versioning:

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Version Files

Version is stored in:
- `deno.jsonc` (root) - **Primary version**
- `mcp-server/deno.jsonc` - Component version (should match)
- `fresh-ui/deno.jsonc` - Component version (should match)

**Best Practice**: Keep all three in sync, but the root `deno.jsonc` is the source of truth for JSR publishing.

## Publishing Checklist

Before creating a release:

- [ ] All tests pass locally (`deno task test`)
- [ ] Coverage is acceptable (`deno task test:coverage`)
- [ ] Code is formatted (`deno fmt`)
- [ ] No linting errors (`deno lint`)
- [ ] Type checking passes (`deno task check`)
- [ ] CHANGELOG updated with release notes
- [ ] Version bumped in `deno.jsonc`
- [ ] Git changes committed
- [ ] Tag created and pushed OR manual dispatch triggered

## Troubleshooting

### Publish Fails with "Version Already Exists"

**Cause**: Version in `deno.jsonc` already published to JSR.

**Solution**: Bump the version number and try again.

### Publish Fails Tests

**Cause**: Tests failing in CI environment.

**Solution**: 
1. Run tests locally to reproduce
2. Fix failing tests
3. Commit and push fix
4. Re-tag or re-run workflow

### Wrong Version Published

**Cause**: Typo in tag or manual version input.

**Solution**: 
1. Cannot delete JSR versions
2. Publish a new version with correct number
3. Update documentation to skip problematic version

### Workflow Doesn't Trigger

**Cause**: Tag format doesn't match `v*.*.*` pattern.

**Solution**: Ensure tag starts with `v` followed by semantic version:
- ✅ `v1.0.0`
- ✅ `v1.0.0-beta.1`
- ❌ `1.0.0` (missing `v` prefix)
- ❌ `release-1.0.0` (wrong format)

## JSR Package Exclusions

The following files/directories are excluded from the published package:

```jsonc
"publish": {
  "exclude": [
    "**/.DS_Store",
    "**/.env",
    "**/.env.*",
    "!**/.env.example",      // Include .env.example
    "mcp-server/data/",
    "tests/coverage/",
    "**/*.test.ts",
    "**/test_*.ts",
    "screenshot*.png",
    "docs/**",
    "GUIDELINES.md",
    "TEST_SUMMARY.md"
  ]
}
```

This keeps the published package lean while including necessary examples and documentation.

## Testing Before Publishing

Test the package locally before publishing:

```bash
# Dry run to see what would be published
deno publish --dry-run

# Check package contents
deno publish --dry-run --json
```

## Post-Publishing

After successful publish:

1. **Create GitHub Release**:
   - Go to GitHub Releases
   - Create new release from tag
   - Add release notes
   - Publish release

2. **Update Documentation**:
   - Update README if needed
   - Update CHANGELOG
   - Update any examples with new version

3. **Announce**:
   - Social media
   - Discord/Slack channels
   - Project users/stakeholders

4. **Monitor**:
   - Watch for issues with new version
   - Check JSR package page for stats
   - Respond to user feedback

## Permissions Required

For GitHub Actions to publish to JSR:

- **Repository Settings** → **Actions** → **General**
  - Enable "Read and write permissions" for workflows
  - Enable "Allow GitHub Actions to create and approve pull requests"

- **Workflow Permissions**:
  ```yaml
  permissions:
    contents: read
    id-token: write  # Required for JSR publishing
  ```

No additional secrets or tokens required - JSR publishing uses GitHub's OIDC token.

## References

- [JSR Publishing Docs](https://jsr.io/docs/publishing-packages)
- [Deno Publish Command](https://deno.land/manual/tools/publish)
- [GitHub Actions for Deno](https://github.com/denoland/setup-deno)
- [Semantic Versioning](https://semver.org/)
