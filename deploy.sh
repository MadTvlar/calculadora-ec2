#!/bin/bash
set -Eeuo pipefail

# === Config (ajuste se o script não rodar dentro do repo) ===
APP_DIR="${APP_DIR:-$HOME/calculadora-ec2-hml}"  # caminho do repo HML
BRANCH="${BRANCH:-homolog}"                      # branch alvo p/ HML
HEALTH_URL="${HEALTH_URL:-http://localhost:8081/health}"  # health da HML
RETRIES="${RETRIES:-12}"                         # 12 tentativas
SLEEP_SECS="${SLEEP_SECS:-5}"                    # 5s entre tentativas
export COMPOSE_HTTP_TIMEOUT="${COMPOSE_HTTP_TIMEOUT:-120}"

NOW=$(date '+%Y-%m-%d %H:%M:%S')
echo "⏰ $NOW - Iniciando deploy (HML) em: $APP_DIR / branch: $BRANCH"

# Vai para a pasta do projeto
cd "$APP_DIR"

echo "🔁 Atualizando repositório..."
git fetch --all --prune

# Garante que estamos na branch homolog rastreando o remoto
if ! git rev-parse --abbrev-ref HEAD | grep -q "^$BRANCH$"; then
  echo "🔀 Trocando para a branch $BRANCH..."
  git checkout -B "$BRANCH" "origin/$BRANCH"
fi

# Alinha o working tree com o remoto da branch homolog
git reset --hard "origin/$BRANCH"

echo "🔧 Buildando Docker com timeout (300s)…"
DOCKER_BUILDKIT=1 timeout 300 docker-compose build || {
  echo "❌ Build travado ou lento demais. Abortando…"
  exit 1
}

echo "🧹 Removendo containers antigos…"
docker-compose down --remove-orphans || true

echo "🚀 Subindo novo container…"
docker-compose up -d --build --force-recreate

echo "⏳ Aguardando healthcheck em: $HEALTH_URL"
ok=false
for i in $(seq 1 "$RETRIES"); do
  if curl -fsS "$HEALTH_URL" >/dev/null; then
    ok=true
    break
  fi
  echo "… tentativa $i/$RETRIES ainda sem sucesso; aguardando ${SLEEP_SECS}s"
  sleep "$SLEEP_SECS"
done

if [ "$ok" != true ]; then
  echo "❌ Novo container falhou no healthcheck."
  echo "📜 Logs (últimas 100 linhas):"
  # tenta descobrir o nome do container pelo compose
  cname=$(docker-compose ps -q | xargs -r docker inspect --format '{{.Name}}' 2>/dev/null | sed 's|^/||' | head -n1 || true)
  if [ -n "${cname:-}" ]; then
    docker logs --tail=100 "$cname" || true
  fi
  exit 1
fi

echo "✅ Deploy HML finalizado com sucesso!"

