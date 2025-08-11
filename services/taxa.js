// VALORES USADOS PARA CALCULAR OS JUROS DAS PARCELAS, QUANDO A COMPRA É SELECIONADA "CARTÃO DE CRÉDITO"

const taxas = {
  "Até 12 Parcelas": {
    "valor": 0,
    "parcela": 12
  },

  "13 Parcelas": {
    "valor": 0.1270,
    "parcela": 13
  },

  "14 Parcelas": {
    "valor": 0.1345,
    "parcela": 14
  },

  "15 Parcelas": {
    "valor": 0.1420,
    "parcela": 15
  },

  "16 Parcelas": {
    "valor": 0.1495,
    "parcela": 16
  },

  "17 Parcelas": {
    "valor": 0.1570,
    "parcela": 17
  },

  "18 Parcelas": {
    "valor": 0.1645,
    "parcela": 18
  },

  "19 Parcelas": {
    "valor": 0.1720,
    "parcela": 19
  },

  "20 Parcelas": {
    "valor": 0.1795,
    "parcela": 20
  },

  "21 Parcelas": {
    "valor": 0.1870,
    "parcela": 21
  }
}

module.exports = taxas;
