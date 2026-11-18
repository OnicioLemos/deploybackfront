// CONTROLLER de autenticação: cadastro, login e "quem sou eu".
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

const AuthController = {
  async cadastrar(req, res, next) {
    try {
      const { nome, email, senha } = req.body || {};
      const erros = [];
      if (typeof nome !== 'string' || nome.trim().length < 2) erros.push('nome deve ter pelo menos 2 caracteres');
      if (typeof email !== 'string' || !EMAIL_VALIDO.test(email.trim())) erros.push('e-mail inválido');
      if (typeof senha !== 'string' || senha.length < 6) erros.push('senha deve ter pelo menos 6 caracteres');
      if (erros.length) return res.status(400).json({ erros });

      const emailNormalizado = email.trim().toLowerCase();
      if (await UsuarioModel.buscarPorEmail(emailNormalizado)) {
        return res.status(409).json({ erro: 'Este e-mail já está cadastrado' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const usuario = await UsuarioModel.criar({ nome: nome.trim(), email: emailNormalizado, senhaHash });

      res.status(201).json({ token: gerarToken(usuario), usuario });
    } catch (erro) {
      next(erro);
    }
  },

  async login(req, res, next) {
    try {
      const { email, senha } = req.body || {};
      if (typeof email !== 'string' || typeof senha !== 'string') {
        return res.status(400).json({ erro: 'Informe e-mail e senha' });
      }

      const usuario = await UsuarioModel.buscarPorEmail(email.trim().toLowerCase());
      const senhaConfere = usuario && (await bcrypt.compare(senha, usuario.senha));
      if (!senhaConfere) {
        // Mesma mensagem nos dois casos: não revela se o e-mail existe
        return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
      }

      const { senha: _, ...usuarioPublico } = usuario;
      res.json({ token: gerarToken(usuario), usuario: usuarioPublico });
    } catch (erro) {
      next(erro);
    }
  },

  async eu(req, res, next) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.usuarioId);
      if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado' });
      res.json(usuario);
    } catch (erro) {
      next(erro);
    }
  },
};

module.exports = AuthController;
