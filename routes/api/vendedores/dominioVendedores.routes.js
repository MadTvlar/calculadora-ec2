const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/vendedores/dominioVendedores.controller');

router.get('/ativos', controller.listarAtivos);
router.get('/', controller.listarTodos);
router.delete('/:vendedor_id', controller.desativar);
router.patch('/:vendedor_id/reativar', controller.reativar);

module.exports = router;