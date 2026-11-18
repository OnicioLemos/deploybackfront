// ROTAS de autenticação
const { Router } = require('express');
const AuthController = require('../controllers/authController');
const autenticar = require('../middlewares/autenticar');

const router = Router();

router.post('/cadastro', AuthController.cadastrar); // público
router.post('/login', AuthController.login);        // público
router.get('/eu', autenticar, AuthController.eu);   // protegido

module.exports = router;
