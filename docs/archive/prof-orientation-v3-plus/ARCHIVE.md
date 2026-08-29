# Archived source package — prof-orientation v3+

This is the original methodology package the built-in prof-orientation v3+ test was derived
from. It is kept for provenance only.

**It is not the source of truth and it is out of date.** The runtime reads the committed
fixture at `server/src/tests/prof-orientation-v3-plus/site-config.json`, which has since been
updated with revised question and slider wording. The `04_site_config.json` in this directory
carries the same schema but different content, so treating it as current will produce a test
that does not match the product.

Nothing in `server/`, `client/` or `scripts/` reads these files, and nothing should start.
To change the methodology, edit the fixture and its tests.

Previously stored at the repository root under a Cyrillic directory name containing spaces,
which needed quoting in every shell command and glob that touched the tree.
