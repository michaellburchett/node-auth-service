var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const puppeteer = require('puppeteer');
const User = require('../../lib/models/user.js');
const ResetPasswordToken = require('../../lib/models/reset_password_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);

describe('Reset Passwords', function() {

    before(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();;

        test_data = await add_test_data();
    })

    describe('reset password success', async function() {
        it('should successfully display the reset password page when using a valid token', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                        
                const text = await page.evaluate(() => document.querySelector('.hello').textContent);
                        
                assert.equal(text,"To reset your password, please enter details below:");
            })();
        }).timeout(10000);

        it('should successfully log a user in when their password is reset successfully', async function() {
            await (async () => {
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
            await (async () => {
                await page.goto('http://localhost:3000/forgot-password');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jeremydoe@mailinator.com');
                await page.click('button[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.alert').textContent.trim());

                assert.equal(text,"Sorry, a user with that Email cannot be found");
            })();
        }).timeout(10000);

        it('should not reset the passwords if they do not match', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '1234Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, These Passwords Don't Match");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the user id is not valid', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=38457385777678678676&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, this URL is Invalid");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the user email is not valid', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.working_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe2@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, a user with that Email cannot be found");
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
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, this URL is Invalid");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the reset password token is expired', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.expired_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, This Request is Expired. Please Request a New Email");
            })();
        }).timeout(10000);

        it('should not reset the passwords if the reset password token is already used', async function() {
            await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.user_id + '&reset_password_token=' + test_data.used_token.token);
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.$eval('input[name=password]', el => el.value = '123Reset');
                await page.$eval('input[name=passwordverification]', el => el.value = '123Reset');
                await page.click('input[type="submit"]');
                        
                const text = await page.evaluate(() => document.querySelector('.errorMessage').textContent);
     
                assert.equal(text,"Sorry, This Token Has Already Been Used");
            })();
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jacobdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() + 1); 

        var working_token_data = await (new ResetPasswordToken).create({
            token: 'working_reset_code',
            expiration_date: expiration_date,
            is_used: false,
            user_id: user_data.id
        });

        var used_token_data = await (new ResetPasswordToken).create({
            token: 'used_reset_code',
            expiration_date: expiration_date,
            is_used: true,
            user_id: user_data.id
        });

        var expiration_date = date.setDate(date.getDate() - 2); 

        var expired_token_data = await (new ResetPasswordToken).create({
            token: 'expired_reset_code',
            expiration_date: expiration_date,
            is_used: false,
            user_id: user_data.id
        });

        var package = {
            user_id: user_data.id,
            user_email: user_data.email,
            user_password: '123Password',
            working_token: {
                token: working_token_data.token,
                expiration_date: working_token_data.expiration_date,
                is_used: working_token_data.is_used
            },
            used_token: {
                token: used_token_data.token,
                expiration_date: used_token_data.expiration_date,
                is_used: used_token_data.is_used
            },
            expired_token: {
                token: expired_token_data.token,
                expiration_date: expired_token_data.expiration_date,
                is_used: expired_token_data.is_used
            }
        }

        return package;
    }

    async function remove_test_data() {

        await (new ResetPasswordToken).deleteByField("token",test_data.working_token.token);
        await (new ResetPasswordToken).deleteByField("token",test_data.used_token.token);
        await (new ResetPasswordToken).deleteByField("token",test_data.expired_token.token);
        await (new User).deleteByField("email",test_data.user_email);
    }
});