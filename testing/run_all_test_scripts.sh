#!/bin/bash
# run_all_test_scripts.sh - Validation and compiler checks
set -e

echo "=== Running TypeScript Compile Validation ==="
npx tsc --noEmit

echo "=== All checks passed! ==="
exit 0
