name: Deploy para Amazon ECR

on:
  push:
    branches:
      - main  # Ou a branch que deseja monitorar

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout do Código
        uses: actions/checkout@v3

      - name: Configurar Credenciais AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: sa-east-1

      - name: Login no Amazon ECR
        run: |
          aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin 529088275582.dkr.ecr.sa-east-1.amazonaws.com

      - name: Construir e Taggear a Imagem Docker
        run: |
          docker build -t yamaha-motors .
          docker tag yamaha-motors:latest 529088275582.dkr.ecr.sa-east-1.amazonaws.com/yamaha-motors:latest

      - name: Enviar a Imagem para o Amazon ECR
        run: |
          docker push 529088275582.dkr.ecr.sa-east-1.amazonaws.com/yamaha-motors:latest
