#!/bin/bash
set -e

echo "🔁 Atualizando repositório..."
git pull origin main

echo "🔧 Buildando Docker com timeout..."
DOCKER_BUILDKIT=1 timeout 300 docker-compose build || {
  echo "❌ Build travado ou lento demais. Abortando..."
  exit 1
}

echo "🧪 Subindo novo container em teste..."
docker-compose up -d

echo "⏳ Aguardando healthcheck..."
sleep 10
if ! curl --fail http://localhost:8080/health; then
  echo "❌ Novo container falhou. Mantendo versão atual."
  exit 1
fi

echo "✅ Deploy finalizado com sucesso!"
