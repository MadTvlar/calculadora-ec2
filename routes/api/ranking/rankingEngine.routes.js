const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/ranking/rankingEngine.controller');

router.post('/calcular', controller.calcularManual);
router.post('/calcular-geral', controller.calcularGeral);

module.exports = router;