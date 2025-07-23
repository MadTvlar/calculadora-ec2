const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.use(express.json({ verify: rawBodyBuffer }));

const secret = fs.readFileSync('/home/ubuntu/.webhook_secret', 'utf8').trim();

function rawBodyBuffer(req, res, buf, encoding) {
  req.rawBody = buf;
}

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    console.log('❌ Assinatura inválida');
    return res.status(401).send('Assinatura inválida');
  }

  const ref = req.body?.ref;
  const repo = req.body?.repository?.name;

  const startTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });
  console.log(`📦 Webhook recebido! Repo: ${repo}, Ref: ${ref}`);
  console.log(`🕒 Início do deploy: ${startTime}`);

  if (repo === 'calculadora-ec2' && ref === 'refs/heads/main') {
    console.log('🚀 Novo commit na branch main, iniciando deploy...');
    res.status(200).send('Deploy iniciado');

    exec('bash /home/ubuntu/safe-deploy.sh', (err, stdout, stderr) => {
      const endTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Manaus' });

      console.log('📋 Log do safe-deploy.sh:\n' + stdout);
      if (err) {
        console.error(`❌ Erro no deploy às ${endTime}:\n`, stderr);
        return;
      }
      console.log(`✅ Deploy concluído com sucesso às ${endTime}`);
    });
  } else {
    console.log('ℹ️ Commit ignorado (branch ou repo diferente)');
    res.status(200).send('Ignorado');
  }
});

app.get('/webhook', (req, res) => {
  res.send('Webhook ativo');
});

app.listen(7777, () => {
  console.log('📡 Webhook escutando na porta 7777');
});
