const express = require('express');
const router = express.Router();

const controller = require('../../../controllers/ranking/rankingConfig.controller');

router.get('/', controller.getStatus);
router.patch('/fechar', controller.fechar);
router.patch('/reabrir', controller.reabrir);

module.exports = router;