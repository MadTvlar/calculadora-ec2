const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const ref = req.body?.ref;
  const repo = req.body?.repository?.name;

  const startTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
  console.log(`📦 Webhook recebido! Repo: ${repo}, Ref: ${ref}`);
  console.log(`🕒 Início do deploy: ${startTime}`);

  if (repo === 'calculadora-ec2' && ref === 'refs/heads/main') {
    console.log('🚀 Novo commit na branch main, iniciando deploy...');

    // ✅ responde logo para evitar timeout no GitHub
    res.status(200).send('Deploy iniciado');

    exec('bash /home/ubuntu/safe-deploy.sh', (err, stdout, stderr) => {
      const endTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });

      console.log('📋 Log do safe-deploy.sh:\n' + stdout);

      if (err) {
        console.error(`❌ Erro no deploy às ${endTime}:\n`, stderr);
      } else {
        console.log(`✅ Deploy concluído com sucesso às ${endTime}`);
      }
    });
  } else {
    console.log('ℹ️ Commit ignorado (branch ou repo diferente)');
    res.status(200).send('Ignorado');
  }
});

// healthcheck opcional
app.get('/webhook', (req, res) => {
  res.send('Webhook ativo');
});

app.listen(7777, () => {
  console.log('📡 Webhook escutando na porta 7777');
});
