const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/ranking/rankingSnapshot.controller');

router.post('/gerar', controller.gerar);

module.exports = router;