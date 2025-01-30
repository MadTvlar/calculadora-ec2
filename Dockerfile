# Use uma imagem base do Python
FROM python:3.9-slim

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos do seu projeto para o container
COPY . /app

# Instale as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Exponha a porta 8080
EXPOSE 8080

# Defina o comando para rodar o aplicativo Flask na porta 8080
CMD ["python", "main.py"]
