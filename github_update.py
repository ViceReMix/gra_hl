#!/usr/bin/env python3
"""
Lightweight publisher for GitHub Pages content (GitHub API version).

Behavior:
- Walks the local github_pages/ folder
- Skips the top-level "data/" directory
- Uploads/updates every other file to the target GitHub repo and branch using the GitHub Contents API
- Uses a single-file PUT per asset (simple and robust)

Configuration order of precedence (env overrides settings):
- GITHUB_TOKEN or GH_PAT (required): token with repo Contents write access
- GH_PAGES_BRANCH (default: config.settings.GITHUB_PAGES_BRANCH or 'main')
- GH_PAGES_SRC (default: path of this script's parent directory)
- GITHUB_REPO_OWNER / GITHUB_REPO_NAME (default from config.settings)

Usage:
    python3 github_update.py

Notes:
- No git clone operations; purely GitHub API-based like scripts/journal_exporter.py
- Always publishes to the configured branch (default: 'main').
"""
from __future__ import annotations

import base64
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Tuple

import requests

# Ensure project root is on sys.path so `from config import settings` works
THIS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = THIS_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Try to import project settings for defaults
try:
    from config import settings as cfg
except Exception as e:
    print(f"[warn] Could not import config.settings ({e}). Falling back to env only.")
    cfg = None  # Script will rely on env only if settings import fails


def gather_files(src: Path) -> List[Tuple[str, Path]]:
    """Return list of (relative_path, absolute_path) for files to publish.

    Skips:
    - Top-level data/ directory
    - __pycache__ directories
    """
    items: List[Tuple[str, Path]] = []
    for root, dirs, files in os.walk(src):
        root_path = Path(root)
        rel_root = root_path.relative_to(src)

        # Skip top-level 'data' directory only
        if rel_root.parts and rel_root.parts[0] == 'data':
            continue

        # Skip any __pycache__ directories
        dirs[:] = [d for d in dirs if d != "__pycache__"]

        for f in files:
            # Optional skips: none besides __pycache__ handled above
            s = root_path / f
            rel_path = str((rel_root / f).as_posix())
            items.append((rel_path, s))
    return items


def get_headers(token: str) -> dict:
    return {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }


def get_file_sha(owner: str, repo: str, branch: str, path_in_repo: str, headers: dict) -> str | None:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path_in_repo}"
    params = {'ref': branch}
    r = requests.get(url, headers=headers, params=params)
    if r.status_code == 200:
        try:
            return r.json().get('sha')
        except Exception:
            return None
    return None


def upload_file(owner: str, repo: str, branch: str, token: str, path_in_repo: str, content_bytes: bytes, commit_message: str) -> bool:
    headers = get_headers(token)
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path_in_repo}"

    # Check existing SHA for update
    sha = get_file_sha(owner, repo, branch, path_in_repo, headers)

    content_encoded = base64.b64encode(content_bytes).decode('utf-8')
    data = {
        'message': commit_message,
        'content': content_encoded,
        'branch': branch,
    }
    if sha:
        data['sha'] = sha

    r = requests.put(url, headers=headers, json=data)
    if r.status_code in (200, 201):
        return True
    print(f"[error] Failed to upload {path_in_repo}: {r.status_code} {r.text}")
    return False


def main() -> int:
    # Resolve defaults from settings if available
    default_branch = 'main'
    default_owner = None
    default_repo = None
    default_token = None
    if cfg is not None:
        try:
            default_branch = getattr(cfg, 'GITHUB_PAGES_BRANCH', 'main') or 'main'
        except Exception:
            default_branch = 'main'
        try:
            default_owner = getattr(cfg, 'GITHUB_REPO_OWNER', None)
        except Exception:
            default_owner = None
        try:
            default_repo = getattr(cfg, 'GITHUB_REPO_NAME', None)
        except Exception:
            default_repo = None
        try:
            default_token = getattr(cfg, 'GITHUB_TOKEN', None)
        except Exception:
            default_token = None

    # Environment overrides
    owner = os.environ.get('GITHUB_REPO_OWNER', default_owner or '').strip()
    repo = os.environ.get('GITHUB_REPO_NAME', default_repo or '').strip()
    branch = os.environ.get('GH_PAGES_BRANCH', default_branch).strip()
    # Token: GITHUB_TOKEN > GH_PAT > settings
    token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_PAT') or (default_token or '')
    # Default source is the parent directory of this script (the github_pages folder)
    src_dir = os.environ.get('GH_PAGES_SRC', str(Path(__file__).resolve().parent)).strip()

    if not owner or not repo:
        print('ERROR: GITHUB_REPO_OWNER and GITHUB_REPO_NAME must be set (env or config.settings).')
        return 1
    if not token:
        print('ERROR: GITHUB_TOKEN (or GH_PAT) must be set in environment or config.settings.')
        return 1

    src = Path(src_dir).resolve()
    if not src.exists() or not src.is_dir():
        print(f'ERROR: Source folder not found or not a directory: {src}')
        return 1

    # Ensure .nojekyll exists locally so it is published too
    try:
        (src / '.nojekyll').write_text('')
    except Exception:
        pass

    items = gather_files(src)
    if not items:
        print('[info] Nothing to publish (no files found).')
        return 0

    print(f"[info] Publishing {len(items)} files to {owner}/{repo} on branch '{branch}' (skipping 'data/' folder)")
    ok = True
    for rel_path, abs_path in items:
        # Read as bytes to preserve binary assets if any
        try:
            content = abs_path.read_bytes()
        except Exception as e:
            print(f"[error] Failed to read {abs_path}: {e}")
            ok = False
            continue

        msg = f"Publish {rel_path} at {datetime.now(timezone.utc).isoformat()}"
        if not upload_file(owner, repo, branch, token, rel_path, content, msg):
            ok = False

    if ok:
        print('[ok] GitHub Pages updated via API.')
        return 0
    print('[warn] Completed with some errors. See logs above.')
    return 2


if __name__ == "__main__":
    sys.exit(main())
