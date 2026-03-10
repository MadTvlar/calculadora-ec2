class RankingConfigRepository {
    constructor(connection) {
        this.connection = connection;
    }

    async findByMesAndGrupo(mes_referente, grupo_id) {
        const [rows] = await this.connection.query(
            `
      SELECT *
      FROM core_ranking_config_mes
      WHERE mes_referente = ?
        AND grupo_id = ?
      LIMIT 1
      `,
            [mes_referente, grupo_id]
        );

        return rows[0] || null;
    }

    async create({ mes_referente, grupo_id }) {
        const [result] = await this.connection.query(
            `
      INSERT INTO core_ranking_config_mes (mes_referente, grupo_id)
      VALUES (?, ?)
      `,
            [mes_referente, grupo_id]
        );

        return result.insertId;
    }

    async fechar(mes_referente, grupo_id) {
        await this.connection.query(
            `
      UPDATE core_ranking_config_mes
      SET fechado = 1,
          fechado_em = CURRENT_TIMESTAMP
      WHERE mes_referente = ?
        AND grupo_id = ?
      `,
            [mes_referente, grupo_id]
        );
    }

    async reabrir(mes_referente, grupo_id) {
        await this.connection.query(
            `
      UPDATE core_ranking_config_mes
      SET fechado = 0,
          fechado_em = NULL
      WHERE mes_referente = ?
        AND grupo_id = ?
      `,
            [mes_referente, grupo_id]
        );
    }
}

module.exports = RankingConfigRepository;