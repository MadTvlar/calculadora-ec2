// src/routes/index.js
const express = require('express');
const router = express.Router();

const dominioGruposRoutes = require('./api/grupos/dominioGrupos.routes');
const coreGruposVendedoresRoutes = require('./api/grupos/coreGruposVendedores.routes');
const dominioVendedoresRoutes = require('./api/vendedores/dominioVendedores.routes');
const rankingConfigRoutes = require('./api/ranking/rankingConfig.routes');
const rankingRegrasRoutes = require('./api/ranking/rankingRegras.routes');
const rankingMetricasRoutes = require('./api/ranking/rankingMetricas.routes');
const rankingTiposRoutes = require('./api/ranking/rankingTipos.routes');
const rankingEngineRoutes = require('./api/ranking/rankingEngine.routes');
const rankingSnapshotRoutes = require('./api/ranking/rankingSnapshot.routes');
const rankingResultadoRoutes = require('./api/ranking/rankingResultado.routes');

// Prefixo padrão da API
router.use('/api/dominio/grupos', dominioGruposRoutes);
router.use('/api/grupos-vendedores', coreGruposVendedoresRoutes);
router.use('/api/dominio/vendedores', dominioVendedoresRoutes);
router.use('/api/ranking/config', rankingConfigRoutes);
router.use('/api/ranking/regras', rankingRegrasRoutes);
router.use('/api/ranking/metricas', rankingMetricasRoutes);
router.use('/api/ranking/tipos', rankingTiposRoutes);
router.use('/api/ranking/engine', rankingEngineRoutes);
router.use('/api/ranking/snapshot', rankingSnapshotRoutes);
router.use('/api/ranking/resultado', rankingResultadoRoutes);

module.exports = router;