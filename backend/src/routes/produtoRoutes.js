// ROTAS de produtos: todas exigem login (middleware autenticar)
const { Router } = require('express');
const ProdutoController = require('../controllers/produtoController');
const autenticar = require('../middlewares/autenticar');

const router = Router();

router.use(autenticar);

// Valida o :id antes de chegar ao Controller
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ erro: 'id inválido' });
  next();
});

router.get('/', ProdutoController.listar);
router.get('/:id', ProdutoController.buscarPorId);
router.post('/', ProdutoController.criar);
router.put('/:id', ProdutoController.atualizar);
router.delete('/:id', ProdutoController.remover);

module.exports = router;
