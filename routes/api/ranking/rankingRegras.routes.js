const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/ranking/rankingRegras.controller');

router.get('/:rank_tipo_id', controller.listarPorTipo);
router.post('/', controller.criar);
router.put('/:id', controller.atualizar);
router.post('/ordem', controller.atualizarOrdem);
router.delete('/:id', controller.remover);

module.exports = router;