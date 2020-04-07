var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const mockery = require('mockery');
const nodemailerMock = require('nodemailer-mock');
const app = require('../../lib/index.js');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
const ResetPasswordToken = require('../../lib/models/reset_password_token.js');

const UserDB = require('../../lib/db/user.js');
const ResetPasswordTokenDB = require('../../lib/db/reset_password_token.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});


chai.use(chaiHttp);

describe('Reset Passwords', function() {

    before(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();;

        test_data = await add_test_data();
    })

    describe('reset password success', async function() {


        it('should successfully display the reset password page when using a valid token', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                        
                const text = await page.evaluate(() => document.querySelector('.hello').textContent);
                        
                assert.equal(text,"To reset your password, please enter details below:");
            })();
        }).timeout(10000);

        it('should successfully log a user in when their password is reset successfully', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');

                const bodyHandle = await page.$('body');
                const html = await page.evaluate(body => body.innerHTML, bodyHandle);
                await bodyHandle.dispose();

                assert.equal(html,"OAuth 2.0 Server");
            })();
        }).timeout(10000);
    });

    describe('reset password failure', function() {

        it('should not send an email if the user is not an actual user', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/forgot-password');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jeremydoe@mailinator.com');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.message').textContent);

                assert.equal(text,"Sorry, a user with that Email cannot be found");
            })();
        }).timeout(10000);

        it('should not reset the passwords if they do not match', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '1234Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, These passwords do not match.");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the user id is not valid', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=38457385777678678676&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, Invalid URL.");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the user email is not valid', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe2@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, This is not a valid email address.");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the reset password token is not valid', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=invalid_token');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, Invalid URL.");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the reset password token is expired', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.expired_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, This request is expired. Please request a new email.");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the reset password token is already used', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.used_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.message').textContent);
     
                assert.equal(text,"Sorry, This token has already been used.");
            })();
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await UserDB.create({
            email: 'jacobdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() + 1); 

        var working_token_data = await ResetPasswordTokenDB.create({
            token: 'working_reset_code',
            expiration_date: expiration_date,
            is_used: false,
            user_id: user_data.dataValues.id
        });

        var used_token_data = await ResetPasswordTokenDB.create({
            token: 'used_reset_code',
            expiration_date: expiration_date,
            is_used: true,
            user_id: user_data.dataValues.id
        });

        var expiration_date = date.setDate(date.getDate() - 2); 

        var expired_token_data = await ResetPasswordTokenDB.create({
            token: 'expired_reset_code',
            expiration_date: expiration_date,
            is_used: false,
            user_id: user_data.dataValues.id
        });

        var package = {
            user_id: user_data.dataValues.id,
            user_email: user_data.dataValues.email,
            user_password: '123Password',
            working_token: {
                token: working_token_data.dataValues.token,
                expiration_date: working_token_data.dataValues.expiration_date,
                is_used: working_token_data.dataValues.is_used
            },
            used_token: {
                token: used_token_data.dataValues.token,
                expiration_date: used_token_data.dataValues.expiration_date,
                is_used: used_token_data.dataValues.is_used
            },
            expired_token: {
                token: expired_token_data.dataValues.token,
                expiration_date: expired_token_data.dataValues.expiration_date,
                is_used: expired_token_data.dataValues.is_used
            }
        }

        return package;
    }

    async function remove_test_data() {
        await ResetPasswordToken.destroyByToken(test_data.working_token.token, function(done) {});
        await ResetPasswordToken.destroyByToken(test_data.used_token.token, function(done) {});
        await ResetPasswordToken.destroyByToken(test_data.expired_token.token, function(done) {});
        await User.destroyByEmail(test_data.user_email, function(done) {});
    }
});