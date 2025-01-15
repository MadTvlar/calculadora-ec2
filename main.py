from flask import Flask, render_template, request, redirect, url_for, flash, make_response

app = Flask(__name__)
app.secret_key = 'segredo'  # necessário para utilizar flash

# Dicionário de usuários cadastrados
usuarios = {
    "madson_michel": "220199",
    "louiz_migles": "123",
    "admin": "admin123"
}

motos_yamaha = {
    "neo_24_25": "Neo 125 UBS 24/25",
    "factor_24_25": "Factor 150 UBS 24/25",
    "fazer_24_25": "Fazer 150 UBS 24/25",
    "r6": "Yamaha R6",
    "xj6": "XJ6"
}

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
    "consorcio": "Consórcio",
    "cartao_credito": "Cartão de Crédito",
    "outros": "Outros"
}

filiais = {
    "cachoeirinha": "Cachoeirinha",
    "compensa": "Compensa",
    "cd_nova": "Cidade Nova",
    "max_teixeia": "Max Teixeira"
}

escolhas = {
    "sim": "Sim",
    "nao": "Não"
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

@app.route('/painel')
def painel():
    # A variável 'usuario_logado' recebe o nome do usuário logado
    usuario_logado = request.cookies.get('usuario_logado')  # Recuperando o nome de usuário do cookie

    # Caso o cookie não esteja presente (usuário não logado), redireciona para a página de login
    if not usuario_logado:
        return redirect(url_for('home'))

    return render_template('painel.html', usuario=usuario_logado.replace('_',' ').title(), 
                           motos_yamaha=motos_yamaha, formas_pagamentos=formas_pagamentos,
                           bancos=bancos, filiais=filiais)

@app.route('/logout')
def logout():
    response = make_response(redirect(url_for('home')))
    # Exclui o cookie do usuário logado
    response.delete_cookie('usuario_logado')
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
