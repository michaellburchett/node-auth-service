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

    //Login
    const Login = require('../repositories/login.js');
    app.post('/login', Login.authenticate);
    app.get('/login', Login.show_login);
    app.post('/register', Login.register);
    app.get('/register', Login.show_register);

    //OAuth protected APIs
    const Api = require('../repositories/api.js');
    app.get('/api/userinfo', Api.user_info);
}