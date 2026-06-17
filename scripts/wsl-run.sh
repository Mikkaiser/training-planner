#!/usr/bin/env bash
# Helper: load nvm node 22 and run pnpm/next inside WSL for this project.
set -uo pipefail
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1
nvm use 22 >/dev/null 2>&1
export CI=true
cd /home/mikkaiser/0_projects/training-planner || exit 1
exec "$@"
