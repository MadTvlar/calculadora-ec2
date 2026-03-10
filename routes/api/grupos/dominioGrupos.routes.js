const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/grupos/dominioGrupos.controller');

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/ranking', controller.listRanking);
router.get('/:grupo_id', controller.getById);
router.patch('/:grupo_id/rank-tipo', controller.definirRankTipo);
router.put('/:grupo_id', controller.update);
router.delete('/:grupo_id', controller.remove);

module.exports = router;