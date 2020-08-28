var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../lib/index.js');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
const AccessToken = require('../../lib/models/access_token.js');
const AccessTokenOwnership = require('../../lib/models/access_token_ownership.js');
const RefreshToken = require('../../lib/models/refresh_token.js');
const faker = require('faker');

const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);
var expect = chai.expect;

describe('Implicit Grant', function() {
    
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
            .get('/dialog/authorize?response_type=token&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F')
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                expect(res).to.redirectTo('/login');
                done();
            });
        });

        it('should send a user to the Decision page after a successful login', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=token&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');

                await page.$eval('input[name=email]', (el, value) => el.value = value, test_data.user.email);
                await page.$eval('input[name=password]', (el, value) => el.value = value, test_data.user.password);



                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Samplr is requesting access to your account.");
            })();
        }).timeout(10000);

        it('should send a user a code if they Accept the decision', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=token&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0' })

                const pageUrl = page.url();
                var string = pageUrl.split("access_token=");
                string = string[1].split("&");
                const token = string[0];

                var token_exists;
                (token) ? token_exists = true : token_exists = false;

                assert(token_exists);

                var access_token = await (new AccessToken).fetchByField("token",token);
                var refresh_token = await (new RefreshToken).fetchByField("access_token_id",access_token.id);
                await (new RefreshToken).delete(refresh_token.id);
                await (new AccessTokenOwnership).deleteByField("access_token_id",access_token.id);
                await (new AccessToken).delete(access_token.id);
            })();
        }).timeout(10000);

        it('should successfully authenticate the user info endpoint with a valid access token', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=token&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');
                await page.waitForNavigation({ waitUntil: 'networkidle0' })

                const pageUrl = page.url();
                var string = pageUrl.split("access_token=");
                string = string[1].split("&");
                const token = string[0];

                chai.request(app)
                .get('/api/userinfo')
                .set("Authorization", "Bearer " + token)
                .end(async (error, res) => {

                    assert.equal(res.status,200);

                    var access_token = await (new AccessToken).fetchByField("token",token);
                    var refresh_token = await (new RefreshToken).fetchByField("access_token_id",access_token.id);
                    await (new RefreshToken).delete(refresh_token.id);
                    await (new AccessTokenOwnership).deleteByField("access_token_id",access_token.id);
                    await (new AccessToken).delete(access_token.id);
                });
            })();
        }).timeout(10000);

        it('should successfully generate a new Access Token when given a Refresh Token', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'refresh_token', 
                refresh_token: test_data.user.access_token.refresh_token
            })
            .end(async (err, res) => {

                assert.ok(res.body.access_token.token);

                var access_token = await (new AccessToken).fetchByField("token",res.body.access_token.token);

                await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                await (new AccessTokenOwnership).deleteByField("access_token_id",access_token.id);
                await (new AccessToken).deleteByField("token",res.body.access_token.token);
            });
        }).timeout(10000);

        after(async () => {
            await browser.close();
        })
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jacklyndoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() - 1); 

        var access_token = await (new AccessToken).create({
            token: 'an_access_token',
            expiration_date: expiration_date,
            user_id: user_data.id,
            client_id: 'abc123'
        });

        var refresh_token = await (new RefreshToken).create({
            token: 'a_refresh_token',
            client_id: 'abc123',
            user_id: user_data.id,
            access_token_id: access_token.id
        });

        var package = {
            user: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password',
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

        return package;
    }

    async function remove_test_data() {

        await (new User).deleteByField("email",test_data.user.email);
        await (new RefreshToken).deleteByField("token",test_data.user.access_token.refresh_token.token);
        await (new AccessToken).deleteByField("token",test_data.user.access_token.token);
    }
});