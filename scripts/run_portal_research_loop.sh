#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/run_portal_research_loop.sh [--baseline] [--full-test] [--prompt-only]

Bootstraps the Portal autoresearch loop for use in the Codex app.

Options:
  --baseline     Force a fresh baseline run with `npm run research:portal:eval`
  --full-test    Run `npm test` after prepare/baseline
  --prompt-only  Do not run prepare/eval/test; only print the current prompt
  -h, --help     Show this help text
EOF
}

run_baseline=0
run_full_test=0
prompt_only=0

while (($# > 0)); do
  case "$1" in
    --baseline)
      run_baseline=1
      ;;
    --full-test)
      run_full_test=1
      ;;
    --prompt-only)
      prompt_only=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"
cd "$repo_root"

artifact_path="$repo_root/research/portal/artifacts/last-run.json"
prompt_path="$repo_root/research/portal/artifacts/codex-app-prompt.txt"

if [[ "$prompt_only" -eq 0 ]]; then
  npm run research:portal:prepare
  if [[ "$run_baseline" -eq 1 || ! -f "$artifact_path" ]]; then
    npm run research:portal:eval
  fi
  if [[ "$run_full_test" -eq 1 ]]; then
    npm test
  fi
fi

branch="$(git branch --show-current 2>/dev/null || true)"
commit="$(git rev-parse --short HEAD 2>/dev/null || true)"
dirty="$(git status --short 2>/dev/null || true)"

summary_json="$(node - "$artifact_path" <<'NODE'
const fs = require('fs');
const artifactPath = process.argv[2];
let out = {
  loss: 'unknown',
  hardFailures: 'unknown',
  proxyLoopbackOk: 'unknown',
  teamHintRestore: 'unknown',
};
try {
  const raw = fs.readFileSync(artifactPath, 'utf8');
  const data = JSON.parse(raw);
  out = {
    loss: data?.run?.loss ?? 'unknown',
    hardFailures: data?.run?.hardFailures ?? 'unknown',
    proxyLoopbackOk: data?.metrics?.loopbackProxyGuardOk ?? 'unknown',
    teamHintRestore: data?.metrics?.teamCodeHintRestoreOk ?? 'unknown',
  };
} catch {}
process.stdout.write(JSON.stringify(out));
NODE
)"

loss="$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.loss));" "$summary_json")"
hard_failures="$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.hardFailures));" "$summary_json")"
proxy_ok="$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.proxyLoopbackOk));" "$summary_json")"
team_hint_ok="$(node -e "const d = JSON.parse(process.argv[1]); process.stdout.write(String(d.teamHintRestore));" "$summary_json")"

cat > "$prompt_path" <<EOF
Read research/portal/program.md and research/portal/loss.md.
Use the Portal autoresearch loop on this branch.

Current branch: ${branch}
Current commit: ${commit}
Current baseline loss: ${loss}
Current hard failures: ${hard_failures}
Loopback proxy guard ok: ${proxy_ok}
Team-code-hint restore ok: ${team_hint_ok}

Rules:
- Work in public/ and server/ only.
- Do not modify research/portal/*.
- Keep a change only when npm run research:portal:eval improves the loss.
- Treat loopback proxy blocking and x-team-code-hint session restore as hard invariants.
- Run npm test after meaningful kept wins and before proposing merge.
- Continue iterating until I stop you.
EOF

printf '\n'
printf 'Portal autoresearch bootstrap\n'
printf 'repo:     %s\n' "$repo_root"
printf 'branch:   %s\n' "${branch:-unknown}"
printf 'commit:   %s\n' "${commit:-unknown}"
printf 'loss:     %s\n' "$loss"
printf 'failures: %s\n' "$hard_failures"
printf 'prompt:   %s\n' "$prompt_path"
if [[ -n "$dirty" ]]; then
  printf 'git:      working tree has local changes\n'
else
  printf 'git:      working tree clean\n'
fi

printf '\nPaste this into the Codex app:\n\n'
printf '%s\n' '```text'
cat "$prompt_path"
printf '%s\n' '```'
