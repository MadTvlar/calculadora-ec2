from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, make_response
from dados.dados_motos import motos
from dados.user import usuarios


app = Flask(__name__)
app.secret_key = 'segredo'  


formas_pagamentos = {
    "a_vista": "À vista",
    "financiado": "Financiado"
}

bancos = {
    "yamaha": "Yamaha",
    "pan": "Pan",
    "santander": "Santander",
    "bradesco": "Bradesco",
    "c6bank": "C6Bank",
    "cartao_credito": "Cartão de Crédito",
    "outros": "Outros"
}

banco_retorno = {
    "zero": "R0",
    "um": "R1",
    "dois": "R2",
    "tres": "R3",
    "quatro": "R4"
}

filiais = {
    "Cachoeirinha": "Cachoeirinha",
    "Compensa": "Compensa",
    "Cidade Nova": "Cidade Nova",
    "Grande Circular": "Grande Circular",
    "Max Teixeira": "Max Teixeira",
    "Humaita": "Humaitá",
    "Itacoatiara": "Itacoatiara",
    "Iranduba": "Iranduba",
    "Manacapuru": "Manacapuru",
    "Coari": "Coari",
    "Tefé": "Tefé",
}

origem_moto = {
    "Capital": "Capital",
    "Interior": "Interior"
}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/login', methods=['POST'])
def login():
    login = request.form.get('login')
    senha = request.form.get('password')

    # Valida o login e senha
    if login in usuarios and usuarios[login] == senha:
        # Cria a resposta para o painel
        response = make_response(redirect(url_for('painel')))
        # Define o cookie com o nome do usuário logado
        response.set_cookie('usuario_logado', login)
        return response
    else:
        # Se houver erro, usa flash para armazenar a mensagem de erro
        flash("Login ou senha incorretos")
        # Redireciona de volta para a página de login (home)
        return redirect(url_for('home'))

@app.route('/painel', methods=['GET', 'POST'])
def painel():
    usuario_logado = request.cookies.get('usuario_logado')

    if not usuario_logado:
        return redirect(url_for('home'))

    # Renderiza a página normalmente para a requisição GET
    return render_template('painel.html', usuario=usuario_logado.replace('_', ' ').title(),
                           motos_yamaha=motos, formas_pagamentos=formas_pagamentos,
                           bancos=bancos, filiais=filiais, banco_retorno=banco_retorno, origem_moto=origem_moto)

@app.route('/dados_moto/<nome_moto>', methods=['GET'])
def obter_dados_moto(nome_moto):
    nome_moto = nome_moto.replace('%20', ' ')  # Corrige o nome da moto se houver espaço
    if nome_moto in motos:
        dados_moto = motos[nome_moto]
        return jsonify({
            'manaus_custo_produto': dados_moto.get('manaus_custo_produto', 'N/A'),
            'manaus_pps': dados_moto.get('manaus_pps', 'N/A'),
            'interior_custo_produto': dados_moto.get('interior_custo_produto', 'N/A'),
            'interior_pps': dados_moto.get('interior_pps', 'N/A'),
            'revisao': dados_moto.get('revisao', 'N/A')
        })
    else:
        return jsonify({'error': 'Moto não encontrada'}), 404




@app.route('/logout')
def logout():
    response = make_response(redirect(url_for('home')))
    # Exclui o cookie do usuário logado
    response.delete_cookie('usuario_logado')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
