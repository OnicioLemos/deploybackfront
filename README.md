# Loja MVC — API REST com login + front-end

Aplicação em duas partes, no mesmo repositório:

- **`backend/`** — API REST em MVC com Node.js, Express, Prisma e MySQL. Cadastro e login de usuários (senha com hash bcrypt, sessão com token JWT) e CRUD de produtos protegido: cada usuário só vê e altera os próprios produtos.
- **`frontend/`** — página única em HTML, CSS e JavaScript puro: tela de login/cadastro e, depois de entrar, cadastro, listagem, edição, exclusão e busca de produtos na mesma página.

Hospedagem: **banco na Clever Cloud**, **API e front no Render** (dois serviços gratuitos).

```
[ Navegador ] ──► [ Render Static Site: frontend ] 
      │
      └── fetch + token ──► [ Render Web Service: backend ] ──► [ Clever Cloud: MySQL ]
```

## Estrutura

```
loja-mvc/
├── backend/
│   ├── prisma/schema.prisma            # tabelas loja_usuarios e loja_produtos
│   ├── src/
│   │   ├── config/prisma.js
│   │   ├── models/                      # MODEL: acesso ao banco
│   │   │   ├── usuarioModel.js
│   │   │   └── produtoModel.js
│   │   ├── controllers/                 # CONTROLLER: validação e regras
│   │   │   ├── authController.js
│   │   │   └── produtoController.js
│   │   ├── middlewares/autenticar.js    # confere o token antes das rotas protegidas
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── produtoRoutes.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/                            # VIEW: o que o usuário vê
│   ├── index.html
│   ├── style.css
│   ├── config.js                        # URL da API (editar após o deploy)
│   └── app.js
└── .gitignore
```

## Rotas da API

| Método | Rota              | Protegida? | O que faz                         | Corpo (JSON) |
|--------|-------------------|------------|-----------------------------------|--------------|
| GET    | `/`               | não        | Verifica se a API está no ar      | — |
| POST   | `/auth/cadastro`  | não        | Cria usuário e já devolve o token | `{ "nome": "Ana", "email": "ana@email.com", "senha": "123456" }` |
| POST   | `/auth/login`     | não        | Devolve o token                   | `{ "email": "ana@email.com", "senha": "123456" }` |
| GET    | `/auth/eu`        | sim        | Dados do usuário logado           | — |
| GET    | `/produtos`       | sim        | Lista os produtos do usuário      | — |
| GET    | `/produtos/:id`   | sim        | Busca um produto                  | — |
| POST   | `/produtos`       | sim        | Cria                              | `{ "nome": "Caneta", "preco": 2.5, "estoque": 10 }` |
| PUT    | `/produtos/:id`   | sim        | Atualiza (parcial)                | `{ "preco": 3 }` |
| DELETE | `/produtos/:id`   | sim        | Remove                            | — |

Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`. No Postman: aba **Authorization → Bearer Token**, cole o token recebido no login.

Códigos de resposta: `400` dados inválidos · `401` sem login ou token expirado · `404` não encontrado · `409` e-mail já cadastrado · `500` erro interno.

---

# Passo a passo do deploy

## Etapa 1 — Banco na Clever Cloud

Você tem duas opções:

- **Banco novo (recomendado):** em <https://console.clever-cloud.com>, **Create → an add-on → MySQL → plano DEV**, com um nome como `loja-mvc-db`. Copie a **Connection URI** (painel do add-on → **Add-on dashboard**).
- **Reaproveitar o banco da primeira API:** funciona, porque as tabelas deste projeto têm o prefixo `loja_` e não conflitam com a tabela `produtos` da outra API. Só fique atento ao limite de 5 conexões do plano DEV (veja "Limitações").

Monte a `DATABASE_URL` acrescentando `?connection_limit=2` ao final da URI:

```
mysql://USUARIO:SENHA@HOST.services.clever-cloud.com:3306/NOMEDOBANCO?connection_limit=2
```

## Etapa 2 — Rodar localmente (opcional, mas recomendado)

**Backend**, no terminal do VS Code:

```bash
cd backend
copy .env.example .env       # no PowerShell/CMD (no Git Bash: cp .env.example .env)
```

Edite o `.env`: cole a `DATABASE_URL` e troque o `JWT_SECRET` por um texto longo qualquer. Depois:

```bash
npm install
npm run db:push    # cria as tabelas loja_usuarios e loja_produtos
npm run dev        # API em http://localhost:3000
```

**Frontend:** instale a extensão **Live Server** no VS Code (não precisa de administrador), clique com o botão direito em `frontend/index.html` → **Open with Live Server**. A página abre em `http://127.0.0.1:5500` e, por estar em `localhost`, o `config.js` já aponta para `http://localhost:3000`.

## Etapa 3 — Enviar para o GitHub

Crie um repositório (ex.: `loja-mvc`) e, na pasta raiz do projeto (a que contém `backend/` e `frontend/`):

```bash
git init
git add .
git commit -m "Loja MVC: API com login e front-end"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/loja-mvc.git
git push -u origin main
```

Confira no GitHub que **não** existe `backend/.env` no repositório.

## Etapa 4 — API no Render (Web Service)

No Render: **New → Web Service** → escolha o repositório `loja-mvc` e preencha:

| Campo              | Valor |
|--------------------|-------|
| Name               | `loja-mvc-api` |
| Language           | `Node` |
| Branch             | `main` |
| **Root Directory** | `backend` |
| Build Command      | `npm install && npx prisma db push` |
| Start Command      | `npm start` |
| Instance Type      | **Free** |

Em **Environment Variables**:

| Key            | Value |
|----------------|-------|
| `DATABASE_URL` | a URL da etapa 1 (sem aspas) |
| `JWT_SECRET`   | clique em **Generate** para o Render criar um valor aleatório |

Ainda **não** crie `CORS_ORIGIN` (fica para a etapa 7). Clique em **Deploy Web Service** e espere o status **Live**.

Anote a URL da API, por exemplo `https://loja-mvc-api.onrender.com`, e teste no navegador: deve aparecer `{"status":"ok", ...}`.

## Etapa 5 — Apontar o front para a API

Abra `frontend/config.js` e troque `https://SUA-API.onrender.com` pela URL anotada (sem `/` no final):

```js
  : 'https://loja-mvc-api.onrender.com';
```

Envie a alteração:

```bash
git add .
git commit -m "Configura URL da API"
git push
```

## Etapa 6 — Front no Render (Static Site)

No Render: **New → Static Site** → mesmo repositório `loja-mvc`:

| Campo              | Valor |
|--------------------|-------|
| Name               | `loja-mvc` |
| Branch             | `main` |
| Root Directory     | *(deixe em branco)* |
| Build Command      | *(deixe em branco; se o Render exigir, use `echo ok`)* |
| Publish Directory  | `frontend` |

Clique em **Deploy Static Site**. A URL fica parecida com `https://loja-mvc.onrender.com`. Diferente da API, o site estático **não dorme**.

## Etapa 7 — Liberar o front na API (CORS)

Para que só o seu front possa chamar a API:

1. Abra o Web Service `loja-mvc-api` → **Environment**.
2. Adicione `CORS_ORIGIN` = a URL do Static Site, **sem barra no final** (ex.: `https://loja-mvc.onrender.com`).
3. **Save, rebuild, and deploy**.

## Etapa 8 — Testar

1. Abra a URL do Static Site.
2. Aba **Criar conta** → cadastre um usuário. A tela de produtos abre automaticamente.
3. Cadastre, edite (botão **Editar** carrega o produto no formulário), busque e exclua produtos.
4. Clique em **Sair** e entre de novo com o mesmo e-mail e senha.
5. Crie um segundo usuário: ele começa com a lista vazia — cada um só vê os próprios produtos.

A partir daqui, todo `git push` atualiza a API e o front automaticamente.

---

## Limitações do plano gratuito

- **A API dorme** após 15 minutos sem requisições; a próxima demora cerca de 1 minuto. O front mostra "Conectando ao servidor…" enquanto isso. Antes da aula, abra o site alguns minutos antes.
- **Clever Cloud DEV:** 10 MB e até 5 conexões simultâneas. Se as duas APIs usarem o mesmo banco, cada uma com `connection_limit=2`, sobra 1 conexão: use `?connection_limit=1` no `.env` da sua máquina e feche o Prisma Studio quando não estiver usando.
- **Login dura 8 horas.** Depois disso o front volta sozinho para a tela de login.

## Problemas comuns

| Sintoma | Causa provável / solução |
|---|---|
| Front mostra "Não foi possível conectar à API" | URL errada em `frontend/config.js`, ou CORS bloqueando. Abra o console do navegador (F12). |
| Console mostra erro de **CORS** | `CORS_ORIGIN` diferente da URL do front (barra no final, `http` em vez de `https`). Corrija e faça redeploy da API. |
| Deploy da API falha com `JWT_SECRET` | Variável não criada no Render. |
| `P1001` / `Access denied` no build | `DATABASE_URL` com aspas, espaço ou faltando pedaço. |
| `max_user_connections` / `Too many connections` | Muitas conexões no plano DEV. Veja "Limitações". |
| Static Site mostra "Not Found" | Publish Directory diferente de `frontend`. |
| Erro 401 em tudo depois de trocar o `JWT_SECRET` | Tokens antigos ficaram inválidos. Clique em **Sair** e entre de novo. |
