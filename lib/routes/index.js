module.exports = function(app){
    //Default Landing
    app.get('/', function(req, res) {
        res.send('OAuth 2.0 Server')
    });

    //OAuth
    const OAuth2 = require('../controllers/oauth2Controller.js');
    app.get('/dialog/authorize', OAuth2.authorization);
    app.post('/dialog/authorize/decision', OAuth2.decision);
    app.post('/oauth/token', OAuth2.token);

    //Login & Register
    const Login = require('../controllers/loginController.js');
    app.post('/login', Login.authenticate);
    app.get('/login', Login.show_login);
    app.post('/register', Login.register);
    app.get('/register', Login.show_register);

    //Forgot Password
    const forgotPasswordController = require('../controllers/forgotPasswordController.js');
    app.get('/forgot-password', forgotPasswordController.get);
    app.get('/forgot-password-success', forgotPasswordController.show_forgot_password_success);
    app.post('/forgot-password', forgotPasswordController.post);

    //Reset Password
    const resetPasswordController = require('../controllers/resetPasswordController.js');
    app.get('/reset-password', resetPasswordController.get);
    app.post('/reset-password', resetPasswordController.post);

    //OAuth protected APIs
    const userController = require('../controllers/userController.js');
    app.get('/api/userinfo', userController.get);
}