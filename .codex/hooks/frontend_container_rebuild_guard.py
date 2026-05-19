import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = PROJECT_ROOT / ".codex" / "state"
STATE_FILE = STATE_DIR / "frontend-container-rebuild.json"

FRONTEND_REBUILD_PATTERNS = [
    r"\bdocker\s+compose\b(?=.*\bup\b)(?=.*\bfrontend\b)(?=.*--force-recreate\b)",
]

FRONTEND_VERIFY_PATTERNS = [
    r"\bnpm\s+run\s+verify:(?:local|template|e2e:critical|smoke:client)\b",
    r"\bnpm\s+run\s+lint\b",
    r"\bnpm\s+run\s+build\b.*--prefix\s+client\b",
    r"\bnpm\s+--prefix\s+client\s+run\s+build\b",
    r"\bnpm\s+run\s+test\b.*--prefix\s+client\b",
    r"\bnpm\s+--prefix\s+client\s+(?:run\s+)?test\b",
    r"\bnpm\s+test\b",
    r"\b(?:vitest|jest|playwright|eslint)\b",
]


def run_git(args: list[str]) -> str:
    try:
        return subprocess.run(
            ["git", *args],
            cwd=PROJECT_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        ).stdout
    except OSError:
        return ""


def changed_frontend_paths(status_output: str) -> list[Path]:
    paths: list[Path] = []
    for line in status_output.splitlines():
        if not line:
            continue
        raw_path = line[3:]
        if " -> " in raw_path:
            raw_path = raw_path.split(" -> ", 1)[1]
        raw_path = raw_path.strip().strip('"')
        if raw_path.startswith("client/") or raw_path.startswith("client\\"):
            paths.append(PROJECT_ROOT / raw_path)
    return paths


def frontend_fingerprint() -> dict[str, str]:
    status = run_git(["status", "--porcelain=v1", "--untracked-files=all", "--", "client"])
    diff = run_git(["diff", "--binary", "--", "client"])
    cached_diff = run_git(["diff", "--cached", "--binary", "--", "client"])

    stat_rows: list[str] = []
    for path in changed_frontend_paths(status):
        try:
            stat = path.stat()
        except OSError:
            stat_rows.append(f"{path.relative_to(PROJECT_ROOT).as_posix()}:missing")
            continue
        stat_rows.append(
            f"{path.relative_to(PROJECT_ROOT).as_posix()}:{stat.st_size}:{stat.st_mtime_ns}"
        )

    payload = "\n".join([status, diff, cached_diff, *sorted(stat_rows)])
    return {
        "dirty": "true" if status.strip() else "false",
        "hash": hashlib.sha256(payload.encode("utf-8")).hexdigest(),
    }


def command_matches(command: str, patterns: list[str]) -> bool:
    normalized = " ".join(command.lower().split())
    return any(re.search(pattern, normalized) for pattern in patterns)


def read_payload() -> dict:
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def load_recorded_hash() -> str | None:
    try:
        data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    value = data.get("frontendFingerprintHash")
    return value if isinstance(value, str) else None


def record_rebuild(fingerprint: dict[str, str]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(
        json.dumps(
            {
                "frontendFingerprintHash": fingerprint["hash"],
                "dirty": fingerprint["dirty"] == "true",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def tool_response_succeeded(payload: dict) -> bool:
    response = payload.get("tool_response")
    if isinstance(response, dict):
        for key in ("exit_code", "exitCode", "status"):
            value = response.get(key)
            if isinstance(value, int):
                return value == 0

    response_text = json.dumps(response, ensure_ascii=False).lower()
    if "exit code: 0" in response_text or '"exit_code": 0' in response_text:
        return True
    if re.search(r"exit code:\s*[1-9]", response_text):
        return False

    return "error" not in response_text and "failed" not in response_text


def main() -> None:
    payload = read_payload()
    event_name = str(payload.get("hook_event_name") or payload.get("hookEventName") or "")
    command = str(payload.get("tool_input", {}).get("command") or "")

    if not command:
        print("{}")
        return

    if event_name == "PostToolUse":
        if command_matches(command, FRONTEND_REBUILD_PATTERNS) and tool_response_succeeded(payload):
            record_rebuild(frontend_fingerprint())
        print("{}")
        return

    if not command_matches(command, FRONTEND_VERIFY_PATTERNS):
        print("{}")
        return

    if command_matches(command, FRONTEND_REBUILD_PATTERNS):
        print("{}")
        return

    fingerprint = frontend_fingerprint()
    if fingerprint["dirty"] == "false":
        print("{}")
        return

    if load_recorded_hash() == fingerprint["hash"]:
        print("{}")
        return

    reason = (
        "Frontend files under client/ changed. Before frontend-related testing, "
        "rebuild/recreate the frontend container with: "
        "docker compose up -d --build --force-recreate frontend"
    )
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


if __name__ == "__main__":
    main()
