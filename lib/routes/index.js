module.exports = function(app){
    //Default Landing
    app.get('/', function(req, res) {
        res.send('OAuth 2.0 Server')
    });

    //Login
    const loginController = require('../controllers/loginController.js');
    app.get('/login', loginController.get);
    app.post('/login', loginController.post);

    //Logout
    const logoutController = require('../controllers/logoutController.js');
    app.post('/logout', logoutController.post)

    //Register
    const registerController = require('../controllers/registerController.js');
    app.get('/register', registerController.get);
    app.post('/register', registerController.post);

    //Forgot Password
    const forgotPasswordController = require('../controllers/forgotPasswordController.js');
    app.get('/forgot-password', forgotPasswordController.get);
    app.get('/forgot-password-success', forgotPasswordController.show_forgot_password_success);
    app.post('/forgot-password', forgotPasswordController.post);

    //Reset Password
    const resetPasswordController = require('../controllers/resetPasswordController.js');
    app.get('/reset-password', resetPasswordController.get);
    app.post('/reset-password', resetPasswordController.post);

    //OAuth
    const oauth2Controller = require('../controllers/oauth2Controller.js');
    app.get('/dialog/authorize', oauth2Controller.authorize);
    app.post('/dialog/authorize/decision', oauth2Controller.decision);
    app.post('/oauth/token', oauth2Controller.token);

    //User
    const userController = require('../controllers/userController.js');
    app.get('/api/userinfo', userController.get);
}