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

describe('Register Accounts', function() {

    before(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();

        User.create('jamesdoe@mailinator.com', '123Password', function(user) {});
    })

    describe('registration success', function() {

        it('should successfully register an account', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jerrydoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.body').textContent);

                assert.equal(text,"OAuth 2.0 Server");
            });
        }).timeout(10000);
    });

    describe('registration failure', function() {

        it('should not register an account is passwords do not match', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jimdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '456Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Register:");
            });
        }).timeout(10000);

        it('should not register an account is a user with that username already exists', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jamesdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Register:");
            });
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        User.destroyByEmail("jerrydoe@mailinator.com", function(done) {});
        User.destroyByEmail("jimdoe@mailinator.com", function(done) {});
        User.destroyByEmail("jamesdoe@mailinator.com", function(done) {});
    })
});