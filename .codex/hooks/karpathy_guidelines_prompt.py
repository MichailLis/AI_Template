import json
import re
import sys


CODE_TASK_PATTERNS = [
    r"\badd\b",
    r"\bbug\b",
    r"\bbuild\b",
    r"\bcode\b",
    r"\bcomponent\b",
    r"\bdebug\b",
    r"\bfix\b",
    r"\bimplement\b",
    r"\brefactor\b",
    r"\breview\b",
    r"\btest\b",
    r"\btypescript\b",
    r"\bjavascript\b",
    r"\bpython\b",
    r"\bисправ",
    r"\bдобав",
    r"\bкод\b",
    r"\bкомпонент",
    r"\bотлаж",
    r"\bревью\b",
    r"\bреализ",
    r"\bрефактор",
    r"\bтест",
]

BROAD_CHANGE_PATTERNS = [
    r"\bcleanup\b",
    r"\boverhaul\b",
    r"\brewrite\b.*\b(all|everything|entire|whole)\b",
    r"\bwide refactor\b",
    r"\bпо всему проекту\b",
    r"\bпо всей кодовой базе\b",
    r"\bперепиши\b.*\bвсе\b",
    r"\bрефакторинг\b.*\bвсего\b",
]

MULTI_STEP_PATTERNS = [
    r"\bend[- ]to[- ]end\b",
    r"\bfull[- ]stack\b",
    r"\bfrontend\b.*\bbackend\b",
    r"\bwith tests?\b",
    r"\bworkflow\b",
    r"\bфронтенд\b.*\bбэкенд\b",
    r"\bс тест",
    r"\bс нуля\b",
]


def matches_any(prompt: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, prompt) for pattern in patterns)


def looks_multi_step(prompt: str) -> bool:
    action_hits = sum(bool(re.search(pattern, prompt)) for pattern in CODE_TASK_PATTERNS)
    has_coordination = any(token in prompt for token in (" and ", " then ", " also ", " и ", " потом ", " также "))
    return matches_any(prompt, MULTI_STEP_PATTERNS) or (action_hits >= 2 and has_coordination)


def build_context(prompt: str) -> str:
    messages = [
        "Use the installed $karpathy-guidelines skill for this code task when available. "
        "State material assumptions, keep changes surgical, prefer the simplest working implementation, "
        "and define concrete verification before claiming the work is done."
    ]

    if matches_any(prompt, BROAD_CHANGE_PATTERNS):
        messages.append(
            "Watch for over-broad scope: do not do repo-wide cleanup, modernization, or incidental refactors unless the user explicitly asked for that scope."
        )

    if looks_multi_step(prompt):
        messages.append(
            "This looks multi-step. Write a brief plan with a verification check for each step before editing."
        )

    return "\n".join(messages)


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("{}")
        return

    event_name = str(payload.get("hook_event_name") or payload.get("hookEventName") or "")
    prompt = str(payload.get("prompt") or "").lower()

    if event_name != "UserPromptSubmit" or not prompt:
        print("{}")
        return

    if matches_any(prompt, CODE_TASK_PATTERNS):
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": "UserPromptSubmit",
                        "additionalContext": build_context(prompt),
                    }
                }
            )
        )
        return

    print("{}")


if __name__ == "__main__":
    main()
