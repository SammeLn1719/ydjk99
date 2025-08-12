const Router = require('express').Router();
const authController = require('../controllers/authController').default;
Router.post('/registeration', authController.registeration)
Router.post('/login', authController.login)
Router.get('/user', authController.getUser)

module.exports = Router;
