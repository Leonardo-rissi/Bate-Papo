const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(
    session({
        secret: 'batepapo',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 60 * 1000 }
    })
);

// HTML base com Bootstrap, fundo preto, navbar roxa e letras brancas
function layout(titulo, conteudo, mostrarNav = false) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #0d0d0d;
            color: #ffffff;
            min-height: 100vh;
        }
        .navbar {
            background-color: #6a0dad !important;
        }
        .navbar-brand, .navbar-text {
            color: #ffffff !important;
            font-weight: bold;
        }
        .card {
            background-color: #1a1a1a;
            border: 1px solid #6a0dad;
            color: #ffffff;
        }
        .form-control, .form-select {
            background-color: #2a2a2a;
            border: 1px solid #6a0dad;
            color: #ffffff;
        }
        .form-control:focus, .form-select:focus {
            background-color: #2a2a2a;
            border-color: #9b30d9;
            color: #ffffff;
            box-shadow: 0 0 0 0.2rem rgba(106, 13, 173, 0.4);
        }
        .form-control::placeholder {
            color: #aaaaaa;
        }
        .btn-primary {
            background-color: #6a0dad;
            border-color: #6a0dad;
        }
        .btn-primary:hover {
            background-color: #9b30d9;
            border-color: #9b30d9;
        }
        .btn-outline-light:hover {
            color: #0d0d0d;
        }
        a {
            color: #c084fc;
        }
        a:hover {
            color: #e9d5ff;
        }
        hr {
            border-color: #6a0dad;
        }
        .mensagem-bubble {
            background-color: #1e0a2e;
            border-left: 3px solid #9b30d9;
            padding: 8px 12px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg mb-4">
        <div class="container">
            <span class="navbar-brand">💬 BatePapo</span>
            ${mostrarNav ? `
            <div class="ms-auto">
                <a href="/menu" class="btn btn-outline-light btn-sm me-2">Menu</a>
                <a href="/logout" class="btn btn-outline-light btn-sm">Sair</a>
            </div>` : ''}
        </div>
    </nav>
    <div class="container">
        ${conteudo}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

function verificarLogin(req, res, next) {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.send(layout('Login', `
        <div class="row justify-content-center">
            <div class="col-md-4">
                <div class="card p-4 shadow">
                    <h2 class="mb-4 text-center">Login do Sistema</h2>
                    <form method="post" action="/login">
                        <div class="mb-3">
                            <label class="form-label">Usuário</label>
                            <input class="form-control" name="usuario" placeholder="Digite seu usuário">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Senha</label>
                            <input type="password" class="form-control" name="senha" placeholder="Digite sua senha">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Entrar</button>
                    </form>
                </div>
            </div>
        </div>
    `));
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === "admin" && senha === "123") {
        req.session.logado = true;
        const dataHora = new Date().toLocaleString('pt-BR');
        res.cookie("ultimoAcesso", dataHora);
        res.redirect("/menu");
    } else {
        res.send(layout('Login Inválido', `
            <div class="row justify-content-center">
                <div class="col-md-4">
                    <div class="card p-4 text-center">
                        <p class="text-danger fs-5">❌ Login inválido</p>
                        <a href="/login" class="btn btn-primary">Voltar</a>
                    </div>
                </div>
            </div>
        `));
    }
});

app.get('/menu', verificarLogin, (req, res) => {
    const ultimo = req.cookies.ultimoAcesso || "Primeiro acesso";

    res.send(layout('Menu', `
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card p-4 shadow">
                    <h2 class="mb-3 text-center">Menu do Sistema</h2>
                    <p class="text-center text-secondary mb-4">🕐 Último acesso: ${ultimo}</p>
                    <div class="d-grid gap-3">
                        <a href="/cadastroUsuario" class="btn btn-primary btn-lg">👤 Cadastro de Usuários</a>
                        <a href="/batepapo" class="btn btn-primary btn-lg">💬 Bate-papo</a>
                        <hr>
                        <a href="/logout" class="btn btn-outline-light">Sair</a>
                    </div>
                </div>
            </div>
        </div>
    `, true));
});

let usuarios = [];
let idUsuario = 1;

app.get('/cadastroUsuario', verificarLogin, (req, res) => {
    res.send(layout('Cadastro de Usuário', `
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card p-4 shadow">
                    <h2 class="mb-4 text-center">Cadastro de Usuário</h2>
                    <form method="post" action="/cadastrarUsuario">
                        <div class="mb-3">
                            <label class="form-label">Nome</label>
                            <input class="form-control" name="nome" placeholder="Nome completo">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Data de Nascimento</label>
                            <input type="date" class="form-control" name="data">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Nickname</label>
                            <input class="form-control" name="nick" placeholder="Seu apelido no chat">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Assunto Preferido</label>
                            <select class="form-select" name="assunto">
                                <option>Futebol</option>
                                <option>Games</option>
                                <option>Carros</option>
                                <option>Filmes</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Cadastrar</button>
                    </form>
                    <div class="mt-3 text-center">
                        <a href="/menu">← Voltar ao Menu</a>
                    </div>
                </div>
            </div>
        </div>
    `, true));
});

app.post('/cadastrarUsuario', verificarLogin, (req, res) => {
    const { nome, data, nick, assunto } = req.body;

    if (!nome || !data || !nick || !assunto) {
        res.send(layout('Erro no Cadastro', `
            <div class="row justify-content-center">
                <div class="col-md-5">
                    <div class="card p-4 text-center">
                        <p class="text-danger fs-5">⚠️ Todos os campos são obrigatórios.</p>
                        <a href="/cadastroUsuario" class="btn btn-primary">Voltar</a>
                    </div>
                </div>
            </div>
        `, true));
        return;
    }

    usuarios.push({ id: idUsuario++, nome, data, nick, assunto });

    let linhas = usuarios.map(u => `
        <tr>
            <td>${u.nome}</td>
            <td>${u.nick}</td>
            <td><span class="badge" style="background-color:#6a0dad">${u.assunto}</span></td>
        </tr>
    `).join('');

    res.send(layout('Usuários Cadastrados', `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card p-4 shadow">
                    <h2 class="mb-4 text-center">Usuários Cadastrados</h2>
                    <table class="table table-dark table-striped">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Nickname</th>
                                <th>Assunto</th>
                            </tr>
                        </thead>
                        <tbody>${linhas}</tbody>
                    </table>
                    <div class="d-flex gap-2 justify-content-center mt-3">
                        <a href="/cadastroUsuario" class="btn btn-primary">+ Novo Cadastro</a>
                        <a href="/menu" class="btn btn-outline-light">Menu</a>
                    </div>
                </div>
            </div>
        </div>
    `, true));
});

let mensagens = [];

app.get('/batepapo', verificarLogin, (req, res) => {
    res.send(layout('Bate-papo', `
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card p-4 shadow">
                    <h2 class="mb-4 text-center">💬 Bate-papo</h2>
                    <form method="get" action="/chat">
                        <div class="mb-3">
                            <label class="form-label">Escolha o assunto:</label>
                            <select class="form-select" name="assunto">
                                <option>Futebol</option>
                                <option>Games</option>
                                <option>Carros</option>
                                <option>Filmes</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Entrar no Chat</button>
                    </form>
                    <div class="mt-3 text-center">
                        <a href="/menu">← Voltar ao Menu</a>
                    </div>
                </div>
            </div>
        </div>
    `, true));
});

app.get('/chat', verificarLogin, (req, res) => {
    const assunto = req.query.assunto;
    const usuariosFiltrados = usuarios.filter(u => u.assunto === assunto);
    const mensagensAssunto = mensagens.filter(m => m.assunto === assunto);

    let options = usuariosFiltrados.map(u =>
        `<option value="${u.nick}">${u.nick}</option>`
    ).join('');

    let lista = mensagensAssunto.length === 0
        ? `<p class="text-secondary text-center">Nenhuma mensagem ainda. Seja o primeiro! 🎉</p>`
        : mensagensAssunto.map(m => `
            <div class="mensagem-bubble">
                <strong style="color:#c084fc">${m.usuario}</strong>: ${m.texto}
                <small class="text-secondary ms-2">(${m.data})</small>
            </div>
        `).join('');

    res.send(layout(`Chat: ${assunto}`, `
        <div class="row justify-content-center">
            <div class="col-md-7">
                <div class="card p-4 shadow">
                    <h2 class="mb-3 text-center">💬 Bate-papo: ${assunto}</h2>
                    <div class="mb-4" style="max-height:350px; overflow-y:auto;">
                        ${lista}
                    </div>
                    <hr>
                    <form method="post" action="/postarMensagem">
                        <input type="hidden" name="assunto" value="${assunto}">
                        <div class="mb-3">
                            <label class="form-label">Usuário</label>
                            <select class="form-select" name="usuario">
                                ${options || '<option disabled>Nenhum usuário cadastrado para este assunto</option>'}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Mensagem</label>
                            <input class="form-control" name="mensagem" placeholder="Digite sua mensagem...">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Enviar</button>
                    </form>
                    <div class="mt-3 text-center">
                        <a href="/menu">← Voltar ao Menu</a>
                    </div>
                </div>
            </div>
        </div>
    `, true));
});

app.post('/postarMensagem', verificarLogin, (req, res) => {
    const { usuario, mensagem, assunto } = req.body;

    if (!usuario || !mensagem || mensagem.trim() === "") {
        res.send(layout('Erro', `
            <div class="row justify-content-center">
                <div class="col-md-5">
                    <div class="card p-4 text-center">
                        <p class="text-danger fs-5">⚠️ Mensagem inválida.</p>
                        <a href="/chat?assunto=${assunto}" class="btn btn-primary">Voltar</a>
                    </div>
                </div>
            </div>
        `, true));
        return;
    }

    mensagens.push({
        usuario,
        texto: mensagem,
        assunto,
        data: new Date().toLocaleString('pt-BR')
    });

    res.redirect(`/chat?assunto=${assunto}`);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});