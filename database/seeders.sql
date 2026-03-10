insert into usuarios (grupo, empresa, id_microwork, nome, email, senha)
values ('admin', 'MCD', '0', 'admin', 'admin@tvlarmotors.com.br', '$2b$10$RlqfOYKmrMJKamNguE4tfem8QsemATgvnKnYfLScAetumUTgW07ua');
-- senha 220199

insert into settings (mesReferente) values ('2026-01'); 
-- necessario para rodar as API

--VENDAS
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 7, 9, 50 FROM core_ranking_metricas WHERE metrica = 'vendas';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 10, 14, 60 FROM core_ranking_metricas WHERE metrica = 'vendas';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 15, 22, 70 FROM core_ranking_metricas WHERE metrica = 'vendas';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 23, NULL, 80 FROM core_ranking_metricas WHERE metrica = 'vendas';

--LLO
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 10, 11.99, 50, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'vendas'
WHERE m.metrica = 'llo';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 12, 13.99, 60, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'vendas'
WHERE m.metrica = 'llo';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 14, 15.99, 70, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'vendas'
WHERE m.metrica = 'llo';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 16, NULL, 80, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'vendas'
WHERE m.metrica = 'llo';

--CAPTCAÇÃO
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 3, 4, 30 FROM core_ranking_metricas WHERE metrica = 'captacao';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 5, 7, 40 FROM core_ranking_metricas WHERE metrica = 'captacao';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 8, 9, 50 FROM core_ranking_metricas WHERE metrica = 'captacao';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 10, NULL, 60 FROM core_ranking_metricas WHERE metrica = 'captacao';

--NPS
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 95, 95.99, 100 FROM core_ranking_metricas WHERE metrica = 'nps';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 96, 96.99, 200 FROM core_ranking_metricas WHERE metrica = 'nps';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 97, 97.99, 300 FROM core_ranking_metricas WHERE metrica = 'nps';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos)
SELECT 1, id, 98, NULL, 500 FROM core_ranking_metricas WHERE metrica = 'nps';

--RETORNO N2
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 3, 4.99, 30, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r2'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 5, 7.99, 40, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r2'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 8, 9.99, 50, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r2'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 10, NULL, 60, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r2'
WHERE m.metrica = 'retorno';

--RETORNO R4
INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 3, 4.99, 50, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r4'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 5, 7.99, 60, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r4'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 8, 9.99, 70, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r4'
WHERE m.metrica = 'retorno';

INSERT INTO core_ranking_regras 
(rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id)
SELECT 1, m.id, 10, NULL, 80, mp.id
FROM core_ranking_metricas m
JOIN core_ranking_metricas mp ON mp.metrica = 'r4'
WHERE m.metrica = 'retorno';