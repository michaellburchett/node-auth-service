module.exports = function(app){
    //Default Landing
    app.get('/', function(req, res) {
        res.send('OAuth 2.0 Server')
    });

    //OAuth
    const OAuth2 = require('../repositories/oauth2.js');
    app.get('/dialog/authorize', OAuth2.authorization);
    app.post('/dialog/authorize/decision', OAuth2.decision);
    app.post('/oauth/token', OAuth2.token);

    //Login & Register
    const Login = require('../repositories/login.js');
    app.post('/login', Login.authenticate);
    app.get('/login', Login.show_login);
    app.post('/register', Login.register);
    app.get('/register', Login.show_register);

    //Reset Password
    const ResetPassword = require('../repositories/reset_password.js');
    app.get('/forgot-password', ResetPassword.show_forgot_password);//Get the reset password page
    app.get('/forgot-password-success', ResetPassword.show_forgot_password_success);//Displayed after successfully ending an email
    app.post('/forgot-password', ResetPassword.forgot_password);//Send the email with token
    app.get('/reset-password', ResetPassword.show_reset_password);//Use token to access screen to reset your password
    app.post('/reset-password', ResetPassword.reset_password);//Send token to reset password for user

    //OAuth protected APIs
    const Api = require('../repositories/api.js');
    app.get('/api/userinfo', Api.user_info);
}