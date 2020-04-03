var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const puppeteer = require('puppeteer');
const User = require('../../models/user.js');
const UserDB = require('../../db/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

chai.use(chaiHttp);
var expect = chai.expect;

describe('Register Accounts', function() {

    before(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();

        test_data = await add_test_data();
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

                await User.getByEmail('jerrydoe@mailinator.com', (user) => {
                    assert.equal(user.email,'jerrydoe@mailinator.com');
                })
            })();
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

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

                assert.equal(text,"Sorry, these passwords do not match");
            })();
        }).timeout(10000);

        it('should not register an account is a user with that email already exists', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/register');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jamesdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Password');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Password');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

                assert.equal(text,"Sorry, a user with that Email already exists");
            })();
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        await remove_test_data();
    })

    async function add_test_data() {
        return await sequelize.transaction(async t => {
            return await UserDB.create({
              email: 'jamesdoe@mailinator.com',
              password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
            }, {transaction: t}).then(result => {
                return result;
            }).catch(err => {
                console.log(err);
            });
        });
    }

    async function remove_test_data() {
        await User.destroyByEmail("jerrydoe@mailinator.com", function(done) {});
        await User.destroyByEmail("jamesdoe@mailinator.com", function(done) {});
    }
});