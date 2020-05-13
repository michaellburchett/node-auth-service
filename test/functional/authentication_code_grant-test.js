var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const app = require('../../lib/index.js');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
const AccessToken = require('../../lib/models/access_token.js');
const AuthorizationCode = require('../../lib/models/authorization_code.js');
const RefreshToken = require('../../lib/models/refresh_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);
var expect = chai.expect;

describe('Authentication Code Grant', function() {
    
    before(async () => {
        test_data = await add_test_data();
    })

    describe('authorize endpoint success', function() {
        
        before(async () => {
            browser = await puppeteer.launch();
            page = await browser.newPage();
        })

        it('should return a login screen when using /dialog/authorize endpoint', function(done) {
            chai.request(app)
            .get('/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F')
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                expect(res).to.redirectTo('/login');
                done();
            });
        });

        it('should send a user to the Decision page after a successful login', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'janedoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Samplr is requesting access to your account.");
            })();
        }).timeout(10000);

        it('should send a user a code if they Accept the decision', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                var code_exists;
                (code.length > 0) ? code_exists = true : code_exists = false;

                assert(code_exists);


                await (new AuthorizationCode).deleteByField("code",code);
            })();
        }).timeout(10000);

        it('should give an access token for a valid code', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');
 
                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                chai.request(app)
                .post('/oauth/token')
                .auth('abc123', 'ssh-secret')
                .send({
                    grant_type: 'authorization_code', 
                    code: code,
                    redirect_uri: 'https://www.google.com/'
                })
                .end(async (err, res) => {
                    res.should.have.status(200);
                    assert(res.body.access_token.token);

                    await (new AuthorizationCode).deleteByField("code",code);
                    await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                    await (new AccessToken).deleteByField("token",res.body.access_token.token);
                });
            })();
        }).timeout(10000);

        it('should successfully authenticate the user info endpoint with a valid access token', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();

                const string = pageUrl.split("code=");
                const code = string[1];

                chai.request(app)
                .post('/oauth/token')
                .auth('abc123', 'ssh-secret')
                .send({
                    grant_type: 'authorization_code', 
                    code: code,
                    redirect_uri: 'https://www.google.com/'
                })
                .end((err, res) => {
                    chai.request(app)
                    .get('/api/userinfo')
                    .set("Authorization", "Bearer " + res.body.access_token.token)
                    .end(async (error, response) => {
                        response.should.have.status(200);


                        await (new AuthorizationCode).deleteByField("code",code);
                        await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                        await (new AccessToken).deleteByField("token",res.body.access_token.token);
                    });
                });
            })();
        }).timeout(10000);

        it('should successfully generate a new Access Token when given a Refresh Token', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'refresh_token', 
                refresh_token: test_data.user_2.authorization_code.access_token.refresh_token
            })
            .end((err, res) => {
                chai.request(app)
                .get('/api/userinfo')
                .set("Authorization", "Bearer " + res.body.access_token.token)
                .end(async (error, response) => {
                    response.should.have.status(200);

                    await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                    await (new AccessToken).deleteByField("token",res.body.access_token.token);
                });
            });
        }).timeout(10000);

        after(async () => {
            await browser.close();
        })
    });

    describe('authorize endpoint failure', function() {
        before(async () => {
            browser = await puppeteer.launch();
            page = await browser.newPage();
        })

        it('should show the proper message when a user is using a wrong password', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jasperdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '456Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

                assert.equal(text,"Sorry, These Passwords Don't Match");
            })();
        }).timeout(10000);

        it('should not send a user a code if they Deny the decision, and in fact should send an "access_denied" error', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.$eval('input[name=email]', el => el.value = 'jasperdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.click('input[type="submit"]');
                await page.waitFor('input[name="cancel"]');
                await page.click('input[name="cancel"]');

                const pageUrl = page.url();
                const string = pageUrl.split("error=");
                const error = string[1];

                assert.equal(error,"access_denied");
            })();
        }).timeout(10000);

        it('should not give an access token for a valid code but wrong client ID', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                chai.request(app)
                .post('/oauth/token')
                .auth('def456', 'ssh-secret')
                .send({
                    grant_type: 'authorization_code', 
                    code: code,
                    redirect_uri: 'https://www.google.com/'
                })
                .end(async (err, res) => {
                    res.should.have.status(500);

                    await (new AuthorizationCode).deleteByField("code",code);
                });
            })();
        }).timeout(10000);

        it('should not give an access token for a valid code and valid client ID but wrong client secret', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                chai.request(app)
                .post('/oauth/token')
                .auth('abc123', 'pop-secret')
                .send({
                    grant_type: 'authorization_code', 
                    code: code,
                    redirect_uri: 'https://www.google.com/'
                })
                .end(async (err, res) => {
                    res.should.have.status(500);

                    await (new AuthorizationCode).deleteByField("code",code);
                });
            })();
        }).timeout(10000);

        it('should not give an access token for an invalid code', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'authorization_code', 
                code: 'an_invalid_code',
                redirect_uri: 'https://www.google.com/'
            })
            .end((err, res) => {
                res.should.have.status(403);
            });
        });

        it('should protect the user info endpoint if an incorrect access token is given', async function() {
            chai.request(app)
            .get('/api/userinfo')
            .set("Authorization", "Bearer IncorrectToken")
            .end((error, response) => {
                response.should.have.status(401);
            });
        });

        it('should protect the user info endpoint if an expired access token is given', async function() {
            chai.request(app)
                .get('/api/userinfo')
                .set("Authorization", "Bearer " + test_data.user_2.authorization_code.access_token)
                .end((error, response) => {
                    response.should.have.status(400);
                });
        });

        after(async () => {
            await browser.close();
        })
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'janedoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var user_2_data = await (new User).create({
            email: 'jasperdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var authorization_code = await (new AuthorizationCode).create({
            email: 'jasperdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds)),
            code: 'sample_authorization_code',
            client_id: 'abc123',
            redirectURI: 'https://www.google.com/',
            ares_scope:  '*',
            user_id: user_2_data.id
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() - 1); 

        var access_token = await (new AccessToken).create({
            token: 'expired_token',
            expiration_date: expiration_date,
            user_id: user_2_data.id,
            client_id: 'abc123'
        });

        var refresh_token = await (new RefreshToken).create({
            token: 'refresh_token',
            client_id: 'abc123',
            user_id: user_2_data.id,
            access_token_id: access_token.id
        });

        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.token,
                password: '123Password'
            },
            user_2: {
                id: user_2_data.id,
                email: user_2_data.token,
                password: '123Password',
                authorization_code: {
                    id: authorization_code.id,
                    code: authorization_code.code,
                    client_id: authorization_code.client_id,
                    redirectURI: authorization_code.redirectURI,
                    ares_scope:  authorization_code.ares_scope,
                    access_token: {
                        id: access_token.id,
                        token: access_token.token,
                        expiration_date: access_token.expiration_date,
                        client_id: access_token.client_id,
                        refresh_token : {
                            token: refresh_token.token,
                            client_id: refresh_token.client_id,
                            user_id: refresh_token.user_id,
                            access_token_id: refresh_token.access_token_id
                        }
                    }
                }
            }
        }

        return package;
    }

    async function remove_test_data() {

        await (new User).deleteByField("email","janedoe@mailinator.com");
        await (new RefreshToken).deleteByField("token","refresh_token");
        await (new AccessToken).deleteByField("token","expired_token");
        await (new AuthorizationCode).deleteByField("code","sample_authorization_code");
        await (new User).deleteByField("email","jasperdoe@mailinator.com");
    }
});