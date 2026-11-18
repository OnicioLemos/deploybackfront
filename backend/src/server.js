// Ponto de entrada: carrega as variáveis de ambiente e sobe o servidor.
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('ERRO: defina a variável JWT_SECRET no .env (local) ou no Render (produção).');
  process.exit(1);
}

const app = require('./app');

// Em produção, o Render define a porta pela variável PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
