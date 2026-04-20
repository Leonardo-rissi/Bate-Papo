const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    session({
        secret: 'batepapo',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 60 * 1000 }
    })
);

function verificarLogin(req, res, next) {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.send(`
        <head>
         <link rel="stylesheet" href="/style.css">
         </head>
        <h2>Login do Sistema</h2>

        <form method="post" action="/login">
        Usuário:<br>
        <input name="usuario"><br><br>

        Senha:<br>
        <input type="password" name="senha"><br><br>

        <button type="submit">Entrar</button>
        </form>
    `);
});

app.post('/login', (req, res) => {

    const { usuario, senha } = req.body;

    if (usuario === "admin" && senha === "123") {

        req.session.logado = true;

        const dataHora = new Date().toLocaleString('pt-BR');
        res.cookie("ultimoAcesso", dataHora);

        res.redirect("/menu");

    } else {

        res.send(`
            <head>
              <link rel="stylesheet" href="/style.css">
            </head>
        Login inválido <br>
        <a href="/login">Voltar</a>
        `);
    }

});

app.get('/menu', verificarLogin, (req, res) => {

    const ultimo = req.cookies.ultimoAcesso || "Primeiro acesso";

    res.send(`
       <head>
         <link rel="stylesheet" href="/style.css">
       </head>
    <h2>Menu do Sistema</h2>

    Último acesso: ${ultimo}

    <br><br>

    <a href="/cadastroUsuario">Cadastro de Usuários</a><br>
    <a href="/batepapo">Bate-papo</a><br><br>

    <a href="/logout">Sair</a>
    `);

});

let usuarios = [];
let idUsuario = 1;

app.get('/cadastroUsuario', verificarLogin, (req, res) => {

    res.send(`
       <head>
         <link rel="stylesheet" href="/style.css">
       </head>

    <h2>Cadastro de Usuário</h2>

    <form method="post" action="/cadastrarUsuario">

    Nome:<br>
    <input name="nome"><br><br>

    Data de Nascimento:<br>
    <input type="date" name="data"><br><br>

    Nickname:<br>
    <input name="nick"><br><br>

    Assunto Preferido:<br>
    <select name="assunto">
        <option>Futebol</option>
        <option>Games</option>
        <option>Carros</option>
        <option>Filmes</option>
    </select>

    <br><br>

    <button type="submit">Cadastrar</button>

    </form>

    <br>
    <a href="/menu">Voltar</a>

    `);

});

app.post('/cadastrarUsuario', verificarLogin, (req, res) => {

    const { nome, data, nick, assunto } = req.body;

    if (!nome || !data || !nick || !assunto) {

        res.send(`
            <head>
             <link rel="stylesheet" href="/style.css">
            </head>
        Todos os campos são obrigatórios.<br>
        <a href="/cadastroUsuario">Voltar</a>
        `);

        return;
    }

    usuarios.push({
        id: idUsuario++,
        nome,
        data,
        nick,
        assunto
    });

    let html = `<h2>Usuários cadastrados</h2><ul>`;

    usuarios.forEach(u => {

        html += `<li>${u.nome} - ${u.nick} - ${u.assunto}</li>`;

    });

    html += `</ul>

    <a href="/cadastroUsuario">Novo cadastro</a><br>
    <a href="/menu">Menu</a>
    `;

    res.send(html);

});

let mensagens = [];

app.get('/batepapo', verificarLogin, (req, res) => {

    res.send(`
        <head>
          <link rel="stylesheet" href="/style.css">
        </head>

    <h2>Bate-papo</h2>

    <form method="get" action="/chat">

    Escolha o assunto:

    <select name="assunto">

    <option>Futebol</option>
    <option>Games</option>
    <option>Carros</option>
    <option>Filmes</option>

    </select>

    <button type="submit">Entrar</button>

    </form>

    <br>
    <a href="/menu">Menu</a>

    `);

});

app.get('/chat', verificarLogin, (req, res) => {

    const assunto = req.query.assunto;

    const usuariosFiltrados = usuarios.filter(u => u.assunto === assunto);

    const mensagensAssunto = mensagens.filter(m => m.assunto === assunto);

    let options = "";

    usuariosFiltrados.forEach(u => {

        options += `<option value="${u.nick}">${u.nick}</option>`;

    });

    let lista = "";

    mensagensAssunto.forEach(m => {

        lista += `<p><b>${m.usuario}</b>: ${m.texto} (${m.data})</p>`;

    });

    res.send(`
        <head>
         <link rel="stylesheet" href="/style.css">
        </head>
    <h2>Bate-papo sobre ${assunto}</h2>

    ${lista}

    <hr>

    <form method="post" action="/postarMensagem">

    <input type="hidden" name="assunto" value="${assunto}">

    Usuário:

    <select name="usuario">
    ${options}
    </select>

    <br><br>

    Mensagem:<br>

    <input name="mensagem">

    <br><br>

    <button type="submit">Enviar</button>

    </form>

    <br>
    <a href="/menu">Menu</a>

    `);

});

app.post('/postarMensagem', verificarLogin, (req, res) => {

    const { usuario, mensagem, assunto } = req.body;

    if (!usuario || !mensagem || mensagem.trim() === "") {

        res.send(`
            <head>
             <link rel="stylesheet" href="/style.css">
            </head>
        Mensagem inválida.<br>
        <a href="/chat?assunto=${assunto}">Voltar</a>
        `);

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