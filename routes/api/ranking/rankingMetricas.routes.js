const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/ranking/rankingMetricas.controller');

router.get('/', controller.listar);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.delete);

module.exports = router;