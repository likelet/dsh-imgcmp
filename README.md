# dsh-imgcmp

A [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) plugin that adds a floating "image duplicate check" widget to the web UI.

Upload two images and it verifies **whether one is a duplicate — or partial duplicate — of the other**, using **feature-point (SuperPoint) matching + RANSAC geometric verification**. It tolerates flips, 90°/180°/270° rotations, transpositions, and non-uniform stretching, and it **annotates the duplicated region** on both images so you can immediately see *where* the overlap is.

This is aimed at suspected images: when you have two figures/panels that look alike and need to confirm they are the same source (e.g. duplicated Western blots, IHC, or microscopy images), it gives a geometric verdict plus a visual map of the matching area — convenient for locating exactly which region repeats.

## Features

- **Two-image upload** in a floating panel (bottom-right capsule button, dismissible with ×).
- **Feature-point verification** — SuperPoint keypoints → descriptor matching → RANSAC homography.
- **Robust to geometric edits** — tries the 8 dihedral (D4) orientations of image B (flip / rotate / transpose), and handles scale & non-uniform stretch.
- **Locates the duplication** — annotated images: `matches` (side-by-side keypoint correspondences, green = inliers / red = outliers), `regionA` / `regionB` (the duplicated region polygon drawn on each image).
- **Aligned overlay** — B is warped onto A's coordinate frame; interactive **blend** (opacity slider) and **wipe** (draggable divider) views make it obvious exactly where the two overlap.
- **Score gauge** — a bar showing geometric inliers against the threshold at a glance (达标 / 未达标).
- **Download** — one-click PNG export of every annotated image.
- **Interpretable verdict** — geometric inlier count vs. an adjustable threshold (default 12).

## How it works

1. Each image is upscaled to at least 800px so small panels yield enough keypoints.
2. SuperPoint extracts keypoints + descriptors (denser sampling via `detection_threshold=0.0001`).
3. Descriptors are matched (mutual-nearest-neighbour with ratio test, or LightGlue when its weights are cached).
4. For each of the 8 dihedral orientations of image B, a RANSAC homography is fitted; the orientation with the most **inliers** (matched points consistent within 3px) wins.
5. If `inliers ≥ threshold`, the pair is reported as a duplicate, and the inlier region is drawn on both images.

## Structure

```text
dsh-imgcmp/
├── package.json     # name/version + exports + dsh.client
├── src/index.js     # host half: POST /api/dsh-imgcmp/compare
├── src/client.js    # client half: shell.overlay floating widget
├── README.md
└── LICENSE
```

## Dependencies (required)

The host half shells out to a Python backend:

```sh
cd <project> && .venv/bin/python compare_bridge.py
```

The `<project>` directory must contain:

- `.venv/` — torch (2.9.x+cu130), torchvision, kornia, Pillow, numpy, opencv-python
- `compare_bridge.py` — stdin→stdout JSON bridge
- `src/lightglue_geo.py` + `src/lightglue_lite/` — SuperPoint implementation
- SuperPoint weights (`superpoint_v1.pth` in the torch hub cache)
- a CUDA-capable GPU

> **Publishing boundary**: the npm/git package ships only the JavaScript shell.
> The Python backend (venv + weights + GPU) must be deployed separately and
> pointed to via `config.project`.

## Install

```sh
# prerequisite: pnpm (used by `dsh plugin` to manage profile plugins)
npm install -g pnpm

# install the package into the web profile
dsh plugin --profile web add "github:likelet/dsh-imgcmp#main"

# mount the insert row (either profile patch or --patch overlay):
#   - insert:
#       - id: imgcmp
#         name: 'dsh-imgcmp'
#         config:
#           project: '/home/zhaoqi/zhaoqi/DSH/bioimg-dedup'
#           timeoutMs: 180000

# restart the web process so the new Node half loads
```

## Config

Insert-row `config` (portable — no code changes needed):

| Option | Default | Description |
|--------|---------|-------------|
| `project` | `/home/zhaoqi/zhaoqi/DSH/bioimg-dedup` | Python project root (contains `.venv/` + `compare_bridge.py`) |
| `timeoutMs` | `180000` | Per-comparison shell timeout (ms) |

Python-side tunables (in `compare_bridge.py` → `src/lightglue_geo.py`):

- `threshold` — inlier verdict threshold (UI-adjustable, default 12).
- `detection_threshold` — sampling density, lower = denser keypoints (current 0.0001).
- `max_kpts` — per-image keypoint cap (default 2048).

## Distribution

The plugin is a pure-cordis plugin (single `apply` + insert row). Options:

1. **Git source (recommended)** — `dsh plugin --profile web add "github:likelet/dsh-imgcmp#main"`.
2. **npm** — `npm publish` in this directory, then `dsh plugin add dsh-imgcmp` (the Python backend still needs separate deployment).
3. **Collection patch** — include the insert row in a `cordis.patch.yml` (e.g. the `dsh-plugins` collection).

## License

[MIT](LICENSE) © 2026 likelet
