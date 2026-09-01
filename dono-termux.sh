#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_DIR=/root/dono-school-erp

run_debian() {
  local command="$1"
  shift
  proot-distro login debian --shared-tmp --bind "${PROJECT_DIR}:${CONTAINER_DIR}" -- bash -lc "$command" -- "$@"
}

case "${1:-help}" in
  install)
    run_debian "apt-get update && apt-get install -y php-cli php-common php-mysql php-sqlite3 php-xml php-mbstring php-curl php-zip php-bcmath php-intl php-gd unzip git composer && php -r 'if (!extension_loaded(\"sodium\")) { fwrite(STDERR, \"Sodium extension is unavailable.\\n\"); exit(1); }' && cd ${CONTAINER_DIR}/backend/dono-api && composer install --no-interaction --prefer-dist --no-progress --optimize-autoloader && php artisan optimize:clear"
    ;;
  artisan)
    shift
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec php artisan \"\$@\"" "$@"
    ;;
  composer)
    shift
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec composer \"\$@\"" "$@"
    ;;
  api)
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec php artisan serve --host=0.0.0.0 --port=8000"
    ;;
  queue)
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec php artisan queue:work --sleep=3 --tries=3 --timeout=120 --max-time=3600"
    ;;
  scheduler)
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec php artisan schedule:work"
    ;;
  test)
    run_debian "cd ${CONTAINER_DIR}/backend/dono-api && exec php artisan test"
    ;;
  help|*)
    cat <<'USAGE'
Usage: ./dono-termux.sh {install|artisan|composer|api|queue|scheduler|test}

Examples:
  ./dono-termux.sh install
  ./dono-termux.sh artisan migrate --force
  ./dono-termux.sh artisan passport:keys
  ./dono-termux.sh artisan tinker --execute='dump(app()->version())'
  ./dono-termux.sh api
  ./dono-termux.sh queue
  ./dono-termux.sh scheduler
USAGE
    ;;
esac
