// CONTROLLER de produtos: valida a entrada, chama o Model e devolve JSON.
// req.usuarioId vem do middleware autenticar.
const ProdutoModel = require('../models/produtoModel');

// Aceita 10, 10.5 ou "10.5"; recusa "", null, "abc"
function ehNumero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor);
  if (typeof valor === 'string') return valor.trim() !== '' && Number.isFinite(Number(valor));
  return false;
}

function validar(body, parcial = false) {
  const erros = [];
  const { nome, preco, estoque } = body;

  if (!parcial || nome !== undefined) {
    if (typeof nome !== 'string' || nome.trim() === '') erros.push('nome é obrigatório');
    else if (nome.trim().length > 100) erros.push('nome deve ter no máximo 100 caracteres');
  }
  if (!parcial || preco !== undefined) {
    if (!ehNumero(preco) || Number(preco) < 0) erros.push('preco deve ser um número >= 0');
  }
  if (estoque !== undefined) {
    if (!ehNumero(estoque) || !Number.isInteger(Number(estoque)) || Number(estoque) < 0) {
      erros.push('estoque deve ser um inteiro >= 0');
    }
  }
  return erros;
}

function montarDados(body) {
  const dados = {};
  if (body.nome !== undefined) dados.nome = body.nome.trim();
  if (body.preco !== undefined) dados.preco = Number(body.preco);
  if (body.estoque !== undefined) dados.estoque = Number(body.estoque);
  return dados;
}

const ProdutoController = {
  async listar(req, res, next) {
    try {
      res.json(await ProdutoModel.listar(req.usuarioId));
    } catch (erro) {
      next(erro);
    }
  },

  async buscarPorId(req, res, next) {
    try {
      const produto = await ProdutoModel.buscarPorId(Number(req.params.id), req.usuarioId);
      if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
      res.json(produto);
    } catch (erro) {
      next(erro);
    }
  },

  async criar(req, res, next) {
    try {
      const erros = validar(req.body || {});
      if (erros.length) return res.status(400).json({ erros });
      const produto = await ProdutoModel.criar(montarDados(req.body), req.usuarioId);
      res.status(201).json(produto);
    } catch (erro) {
      next(erro);
    }
  },

  async atualizar(req, res, next) {
    try {
      const id = Number(req.params.id);
      const erros = validar(req.body || {}, true);
      if (erros.length) return res.status(400).json({ erros });
      if (!(await ProdutoModel.buscarPorId(id, req.usuarioId))) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
      }
      res.json(await ProdutoModel.atualizar(id, montarDados(req.body)));
    } catch (erro) {
      next(erro);
    }
  },

  async remover(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!(await ProdutoModel.buscarPorId(id, req.usuarioId))) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
      }
      await ProdutoModel.remover(id);
      res.status(204).send();
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = ProdutoController;
