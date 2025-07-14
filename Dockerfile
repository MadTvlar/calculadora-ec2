FROM node:18

WORKDIR /app

# Copia só os arquivos de dependência primeiro
COPY package*.json ./

# Instala e cacheia dependências ANTES do código
RUN npm ci --no-audit --progress=true

# Copia todo o resto
COPY ./ ./

EXPOSE 8080
CMD ["node", "server.js"]
