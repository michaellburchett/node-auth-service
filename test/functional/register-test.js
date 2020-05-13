var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
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

        it('should successfully register an account', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jerrydoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('input[type="submit"]');

                var user = await (new User).fetchByField("email","jerrydoe@mailinator.com");
                assert.equal(user.email,'jerrydoe@mailinator.com');
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
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

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
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

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
        await (new User).deleteByField("email","jamesdoe@mailinator.com");
    }
});