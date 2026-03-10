const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/grupos/coreGruposVendedores.controller');

router.post('/', controller.vincular);
router.get('/', controller.listarTodos);
router.get('/:grupo_id', controller.listarPorGrupo);
router.delete('/:grupo_id/:vendedor_id', controller.remover);

module.exports = router;