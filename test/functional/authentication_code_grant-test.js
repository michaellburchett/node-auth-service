var assert = require('assert');

let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let app = require('../../index.js');
const puppeteer = require('puppeteer');
const expiration = require('../../utils/expiration.js');
const User = require('../../models/user.js');
const AccessToken = require('../../models/access_token.js');
const AuthorizationCode = require('../../models/authorization_code.js');

chai.use(chaiHttp);
var expect = chai.expect;

//Future Setup:
//--Add User to DB
//--Add Client to DB

//Future Tear Down:
//--Remove user, client, and assosiated tokens and codes from DB

describe('Authentication Code Grant', function() {

    let browser
    let page;

    describe('authorize endpoint success', function() {

        before(async () => {
            browser = await puppeteer.launch();
            page = await browser.newPage();

            User.create('janedoe@mailinator.com', '123Password', function(user) {});
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
                AuthorizationCode.destroyByCode(code, function(done) {});
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
                .end((err, res) => {
                    res.should.have.status(200);
                    assert(res.body.access_token.token);
                    AuthorizationCode.destroyByCode(code, function(done) {});
                    AccessToken.destroyByToken(res.body.access_token.token, function(done) {});
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
                    .end((error, response) => {
                        response.should.have.status(200);
                        AuthorizationCode.destroyByCode(code, function(done) {});
                        AccessToken.destroyByToken(res.body.access_token.token, function(done) {});
                    });
                });
            })();
        }).timeout(10000);

        after(async () => {
            await browser.close();

            User.destroyByEmail("janedoe@mailinator.com", function(done) {});
        })
    });

    describe('authorize endpoint failure', function() {

        before(async () => {
            browser = await puppeteer.launch();
            page = await browser.newPage();

            User.create('janedoe@mailinator.com', '123Password', function(user) {
                AuthorizationCode.create("sample_authorization_code", "abc123", "https://www.google.com/", "*", user.id, function(code) {
                    var date = new Date();
                    var expiration_date = date.setDate(date.getDate() - 1);   
                    AccessToken.create("expired_token", expiration_date, user.id, "abc123", function(token) {});
                })
            });
        })

        it('should redirect a user back to the login page after an unsuccessful login', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'janedoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '456Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Login:");
            })();
        }).timeout(10000);

        it('should send a user a code if they Accept the decision', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'janedoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.click('input[type="submit"]');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                var code_exists;
                (code.length > 0) ? code_exists = true : code_exists = false;

                assert(code_exists);
                AuthorizationCode.destroyByCode(code, function(done) {});
            })();
        }).timeout(10000);

        it('should not send a user a code if they Deny the decision, and in fact should send an "access_denied" error', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
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
                .end((err, res) => {
                    res.should.have.status(500); //later make it 403, unauthed
                    AuthorizationCode.destroyByCode(code, function(done) {});
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
                .end((err, res) => {
                    res.should.have.status(500); //later make it 403, unauthed
                    AuthorizationCode.destroyByCode(code, function(done) {});
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
            AccessToken.findByToken('expired_token', function(token) {
                chai.request(app)
                .get('/api/userinfo')
                .set("Authorization", "Bearer " + token)
                .end((error, response) => {
                    response.should.have.status(400);
                });
            });
        });

        after(async () => {
            await browser.close();

            //remove user and tokens and codes
            AccessToken.destroyByToken("expired_token", function(done) {});
            AuthorizationCode.destroyByCode("sample_authorization_code", function(done) {});
            User.destroyByEmail("janedoe@mailinator.com", function(done) {});
        })
    });
});