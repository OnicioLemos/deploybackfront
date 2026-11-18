// Configura o Express: middlewares, rotas e tratamento de erros.
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

const app = express();

// CORS_ORIGIN = endereço do front-end (ex.: https://loja-front.onrender.com).
// Sem a variável, qualquer origem é aceita (prático em desenvolvimento).
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rota de saúde: confirma que a API está no ar
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensagem: 'API Loja MVC no ar', rotas: ['/auth', '/produtos'] });
});

app.use('/auth', authRoutes);
app.use('/produtos', produtoRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento central de erros
app.use((erro, req, res, next) => {
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
