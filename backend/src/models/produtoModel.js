// MODEL de produtos: toda consulta é filtrada pelo dono (usuarioId),
// então um usuário nunca enxerga nem altera produtos de outro.
const prisma = require('../config/prisma');

const ProdutoModel = {
  listar(usuarioId) {
    return prisma.produto.findMany({
      where: { usuarioId },
      orderBy: { id: 'desc' },
    });
  },

  buscarPorId(id, usuarioId) {
    return prisma.produto.findFirst({ where: { id, usuarioId } });
  },

  criar(dados, usuarioId) {
    return prisma.produto.create({ data: { ...dados, usuarioId } });
  },

  atualizar(id, dados) {
    return prisma.produto.update({ where: { id }, data: dados });
  },

  remover(id) {
    return prisma.produto.delete({ where: { id } });
  },
};

module.exports = ProdutoModel;
