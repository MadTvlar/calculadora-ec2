from math import ceil

#--------------------------------------------------------------------------------------
def calcular_seguro_cif(custo_produto):
    """Calcula o seguro CIF (0.4346% do custo do produto)."""
    return 0.004346 * custo_produto

def pps_yamaha_ajustado(pps_yamaha, frete, custo_produto):
    """Calcula o Preço Publico Surgerido Ajustado"""
    seguro_cif = calcular_seguro_cif(custo_produto)
    return ceil(pps_yamaha + frete + seguro_cif)

#------------------------------------SIMULAÇÃO-----------------------------------------
def calcular_simulacao(pps_yamaha, frete, custo_produto):
    """O calculo é o mesmo do pps yamaha surgerido ajustado"""
    return pps_yamaha_ajustado(pps_yamaha, frete, custo_produto)

def calcular_percent_simulacao(pps_yamaha, frete, custo_produto):
    """Calcula o valor da porcentagem da diferença da simulação com o pps yamaha"""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return (simulacao / pps_yamaha) -1

#---------------------------------CUSTO POR PRODUTO------------------------------------
def calcular_icms(pps_yamaha, custo_produto):
    """Calcula o ICMS (12% sobre a diferença entre o PPS e o custo)."""
    return (pps_yamaha - custo_produto) * 0.12

def calcular_pis_cofins(frete, custo_produto):
    """Calcula o PIS/COFINS (3,65% sobre a soma custo + frete + seguro CIF)."""
    seguro_cif = calcular_seguro_cif(custo_produto)
    return (custo_produto + frete + seguro_cif) * 0.88 * 0.0365

def calcular_custo_nf_yamaha(pps_yamaha, frete, custo_produto):
    """Calcula o custo total da NF Yamaha"""
    seguro_cif = calcular_seguro_cif(custo_produto)
    icms_retido = calcular_icms(pps_yamaha, custo_produto)
    pis_cofins = calcular_pis_cofins(frete, custo_produto)
    return custo_produto + frete + seguro_cif + icms_retido + pis_cofins

#-----------------------------------LUCRO BRUTO------------------------------------------
def calcular_lucro_bruto_1(pps_yamaha, frete, custo_produto):
    """Calcula o lucro bruto (simulação - custo NF Yamaha)."""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    nf_yamaha = calcular_custo_nf_yamaha(pps_yamaha, frete, custo_produto)
    return simulacao - nf_yamaha

def calcular_percentual_lucro_bruto(pps_yamaha, frete, custo_produto):
    """Calcula o percentual de lucro bruto em relação à simulação."""
    lucro_bruto = calcular_lucro_bruto_1(pps_yamaha, frete, custo_produto)
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return (lucro_bruto / simulacao) * 100

#----------------------------------CUSTOS DIRETO------------------------------------------
def calcular_montagem_revisao(pps_yamaha, frete, custo_produto):
    """Calcula o custo da montagem e revisão, 0.50% em cima da simulação"""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return simulacao * 0.005

def calcular_custo_direto(pps_yamaha, frete, custo_produto, abracy, contrib):
    """Calcula o custo direto (soma de custo NF + montagem/revisão + Abracy + contribuentes)."""
    montagem_revisao = calcular_montagem_revisao(pps_yamaha, frete, custo_produto)
    nf_yamaha = calcular_custo_nf_yamaha(pps_yamaha, frete, custo_produto)
    return nf_yamaha + montagem_revisao + abracy + contrib

#----------------------------------CUSTOS DE COMISSÃO---------------------------------------
def calcular_comissao(pps_yamaha, frete, custo_produto):
    """Calcula o valor da comissão em cima do valor simulado (1%)"""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return simulacao * 0.01

def calcular_dsr(pps_yamaha, frete, custo_produto):
    """Calcular o DSR, que é 25% em cima da comisão"""
    comisao = calcular_comissao(pps_yamaha, frete, custo_produto)
    return comisao * 0.25

def calcular_encargos_com_dsr(pps_yamaha, frete, custo_produto):
    """Calcular o valor de 85% da soma de comissão + dsr"""
    comissao = calcular_comissao(pps_yamaha, frete, custo_produto)
    dsr = calcular_dsr(pps_yamaha, frete, custo_produto)
    return (comissao + dsr) * 0.85

def calcular_custo_comissao(pps_yamaha, frete, custo_produto):
    """Calcula o custo da comissão (comissão + DSR + encargos)."""
    comissao = calcular_comissao(pps_yamaha, frete, custo_produto)
    dsr = calcular_dsr(pps_yamaha, frete, custo_produto)
    encargos = calcular_encargos_com_dsr(pps_yamaha, frete, custo_produto)
    return comissao + dsr + encargos

#-----------------------------------CUSTOS INDIRETO-----------------------------------------
def calcular_mkt_propaganda(pps_yamaha, frete, custo_produto):
    """Calcular o custo de marketing e propaganda"""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return simulacao * 0.005

def calcular_custo_iof(frete, custo_produto):
    """Calcula o custo aproximado de IOF em 0,548%"""
    seguro_cif = calcular_seguro_cif(custo_produto)
    return (custo_produto + frete + seguro_cif) * 0.00548

def calcular_custo_indireto(pps_yamaha, frete, custo_produto, serpro):
    """Calcula o custo indireto (marketing + Serpro + IOF)."""
    mkt_propaganda = calcular_mkt_propaganda(pps_yamaha, frete, custo_produto)
    iof = calcular_custo_iof(frete, custo_produto)
    return mkt_propaganda + serpro + iof

#--------------------------------SOMA TOTAL DOS 3 TIPOS DE CUSTOS------------------------------
def calcular_custo_total(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o custo total (soma de custos com comissão, indiretos e diretos)."""
    custo_direto = calcular_custo_direto(pps_yamaha, frete, custo_produto, abracy, contrib)
    custo_comissao = calcular_custo_comissao(pps_yamaha, frete, custo_produto)
    custo_indireto = calcular_custo_indireto(pps_yamaha, frete, custo_produto, serpro)
    return custo_comissao + custo_indireto + custo_direto

#------------------------------------RESOLUÇÃO FINAL---------------------------------------------
def calcular_lucro_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o valor do lucro bruto (simulação - custo total)"""
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    custo_total = calcular_custo_total(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    return simulacao - custo_total

def percent_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o valor em % (lucro bruto final / simulacao"""
    lucro_bruto_final = calcular_lucro_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return lucro_bruto_final / simulacao

def calcular_cssl_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o valor do cssl 9% do lucro bruto final"""
    lucro_bruto_final = calcular_lucro_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    return lucro_bruto_final * 0.09

def calcular_renda_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula a renda em cima do valor bruto final, 15%"""
    lucro_bruto_final = calcular_lucro_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    return lucro_bruto_final * 0.15

def calcular_lucro_liquido_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o lucro liquido que é lucro bruto final - CSSL - Renda"""
    lucro_bruto_final = calcular_lucro_bruto_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    cssl = calcular_cssl_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    renda = calcular_renda_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    return lucro_bruto_final - cssl - renda

def calcular_percent_lucro_liq_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib):
    """Calcula o valor da fração representada do liquido para a siulação"""
    lucro_liquido = calcular_lucro_liquido_final(pps_yamaha, frete, custo_produto, abracy, serpro, contrib)
    simulacao = calcular_simulacao(pps_yamaha, frete, custo_produto)
    return (lucro_liquido / simulacao)*100