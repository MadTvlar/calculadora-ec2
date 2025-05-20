const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const repo = req.body?.repository?.name;
  if (repo === 'calculadora-ec2') {
    console.log('🚀 Novo push detectado, iniciando deploy...');
    exec('./deploy.sh', (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Erro no deploy:', stderr);
      } else {
        console.log('✅ Deploy concluído:\n', stdout);
      }
    });
  }
  res.sendStatus(200);
});

app.listen(7777, () => {
  console.log('📡 Webhook escutando na porta 7777');
});
