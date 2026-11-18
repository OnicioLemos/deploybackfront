// MODEL de usuários: única camada que acessa a tabela loja_usuarios.
const prisma = require('../config/prisma');

// Campos que podem sair da API (a senha nunca sai)
const camposPublicos = { id: true, nome: true, email: true, criadoEm: true };

const UsuarioModel = {
  buscarPorEmail(email) {
    // Usado no login: aqui precisamos do hash da senha para comparar
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarPorId(id) {
    return prisma.usuario.findUnique({ where: { id }, select: camposPublicos });
  },

  criar({ nome, email, senhaHash }) {
    return prisma.usuario.create({
      data: { nome, email, senha: senhaHash },
      select: camposPublicos,
    });
  },
};

module.exports = UsuarioModel;
