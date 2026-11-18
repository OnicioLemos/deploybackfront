// MIDDLEWARE de autenticação: roda antes do Controller nas rotas protegidas.
// Espera o cabeçalho:  Authorization: Bearer <token>
const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar' });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = dados.id; // disponível para os controllers
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente' });
  }
}

module.exports = autenticar;
