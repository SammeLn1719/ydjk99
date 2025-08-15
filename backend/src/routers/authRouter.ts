const authRouter = require('express').Router();
const authMiddleware = require('../middleware/authMIddleware');
const authController = require('../controllers/authController').default;
const { check } = require('express-validator');
const roleMiddleware = require('../middleware/roleMiddleware');

authRouter.post('/registeration',[
    check('username', 'Имя пользователя не может быть пустым').notEmpty(),
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Пароль должен быть больше 4 символов').isLength({ min: 4 }),
], authController.registeration)
authRouter.post('/login',[
    check('username', 'Имя пользователя не может быть пустым').notEmpty(),
    check('password', 'Пароль должен быть больше 4 символов').isLength({ min: 4 }),
], authController.login)
authRouter.get('/user', roleMiddleware(['user']), authController.getUser)

module.exports = authRouter;
