#!/bin/bash
set -e

NOW=$(date '+%Y-%m-%d %H:%M:%S')
echo "⏰ $NOW - Iniciando deploy..."

echo "🔁 Atualizando repositório..."
git pull origin main

echo "🔧 Buildando Docker com timeout..."
DOCKER_BUILDKIT=1 timeout 300 docker-compose build || {
  echo "❌ Build travado ou lento demais. Abortando..."
  exit 1
}

echo "🧹 Removendo containers antigos..."
docker-compose down --remove-orphans

echo "🧪 Subindo novo container em teste..."
docker-compose up -d --build --force-recreate

echo "⏳ Aguardando healthcheck..."
sleep 10
if ! curl --fail http://localhost:8080/health; then
  echo "❌ Novo container falhou. Mantendo versão atual."
  exit 1
fi

echo "✅ Deploy finalizado com sucesso!"
