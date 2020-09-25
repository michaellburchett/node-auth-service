var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
const AuthorizationCode = require('../../lib/models/authorization_code.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);

describe('Register Accounts', function() {

    before(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();

        test_data = await add_test_data();
    })

    describe('registration success', function() {

        it('should successfully redirect and give a code if adding a new user while using authorize endpoint', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/dialog/authorize?response_type=code&client_id=abc123&redirect_uri=https%3A%2F%2Fwww%2Egoogle%2Ecom%2F');
                await page.waitFor('input[name=email]');
                await page.click('a[name="register"]');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', (el, value) => el.value = value, "testaddinguser@add.add");
                await page.$eval('input[name=password]', (el, value) => el.value = value, "Password123");
                await page.$eval('input[name=passwordverification]', (el, value) => el.value = value, "Password123");
                await page.click('button[type="submit"]');
                await page.waitFor('input[name="accept"]');
                await page.click('input[name="accept"]');

                const pageUrl = page.url();
                const string = pageUrl.split("code=");
                const code = string[1];

                var code_exists;
                (code.length > 0) ? code_exists = true : code_exists = false;

                assert(code_exists);

                await (new AuthorizationCode).deleteByField("code",code);
                await (new User).deleteByField("email","testaddinguser@add.add");
            })();
        }).timeout(10000);

        it('should successfully register an account', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jerrydoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('button[type="submit"]');

                var user = await (new User).fetchByField("email","jerrydoe@mailinator.com");
                assert.equal(user.email,'jerrydoe@mailinator.com');
            })();
        }).timeout(10000);

        it('should successfully display a success message if registering successfully', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jerrydoe22@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('button[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.alert').textContent.trim());

                assert.equal(text,"This user has been added successfully. Sign in to continue");
            })();
        }).timeout(10000);
    });

    describe('registration failure', function() {

        it('should not register an account is passwords do not match', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jimdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '456Password');
                await page.click('button[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.alert').textContent.trim());

                assert.equal(text,"Sorry, These Passwords Don't Match");
            })();
        }).timeout(10000);

        it('should not register an account is a user with that email already exists', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jamesdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('button[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.alert').textContent.trim());

                assert.equal(text,"Sorry, A User With That Email Already Exists");
            })();
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jamesdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })
        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.token,
                password: '123Password'
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).deleteByField("email","jerrydoe@mailinator.com");
        await (new User).deleteByField("email","jerrydoe22@mailinator.com");
        await (new User).deleteByField("email","jamesdoe@mailinator.com");
    }
});