var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../index.js');
const puppeteer = require('puppeteer');
const User = require('../../models/user.js');
const ResetPasswordToken = require('../../models/reset_password_token.js');

const UserDB = require('../../db/user.js');
const ResetPasswordTokenDB = require('../../db/reset_password_token.js');
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

        it('should successfully send an email when a user requests to', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/forgot-password');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jacobdoe@mailinator.com');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);

                assert.equal(text,"Email sent. Please look for the email in your inbox and follow the instructions within.");
            });
        }).timeout(10000);

        it('should successfully display the reset password page when using a valid token', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/reset-password?user_id=' + test_data.dataValues.user_id + '&reset_password_token=' + test_data.dataValues.token);
                await page.waitFor('input[name=email]');
                        
                const text = await page.evaluate(() => document.querySelector('.hello').textContent);
                                
                await ResetPasswordToken.destroyByToken('other_reset_code', function(done) {});
                await User.destroyByEmail("bill@mailinator.com", function(done) {});
                        
                assert.equal(text,"To reset your password, please enter details below:");
            });
            
        }).timeout(10000);

        it('should successfully log a user in when their password is reset successfully', async function() {
            
            chai.request(app)
            .post('/reset-password')
            .send({
                user_id: test_data.dataValues.user_id,
                token: 'sample_reset_code',
                email: 'jacobdoe@mailinator.com',
                password: 'Password456',
                passwordverification: 'Password456',
            })
            .end((err, res) => {
                res.should.have.status(200);
            });
        }).timeout(10000);
    });

    describe('reset password failure', function() {

        it('should not send an email if the user is not an actual user', async function() {
            var text = await (async () => {
                await page.goto('http://localhost:3000/forgot-password');
                await page.waitFor('input[name=email]');
                await page.$eval('input[name=email]', el => el.value = 'jeremydoe@mailinator.com');
                await page.click('input[type="submit"]');

                const text = await page.evaluate(() => document.querySelector('.hello').textContent);
                console.log(text);

                assert.equal(text,"Enter Email:");
            });
        }).timeout(10000);
    });

    after(async () => {
        await browser.close();

        await remove_test_data();
    })

    async function add_test_data() {
        return await sequelize.transaction(async t => {
            return await UserDB.create({
              email: 'jacobdoe@mailinator.com',
              password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
            }, {transaction: t}).then(async user => {
                var date = new Date();
                var expiration_date = date.setDate(date.getDate() + 1);   
                return await ResetPasswordTokenDB.create({
                    token: 'sample_reset_code',
                    expiration_date: expiration_date,
                    is_used: false,
                    user_id: user.id
                }, {transaction: t});
            });
        }).then(result => {
            return result;
        }).catch(err => {
            console.log(err);
        });
    }

    async function remove_test_data() {
        await ResetPasswordToken.destroyByToken('sample_reset_code', function(done) {});
        await User.destroyByEmail("jacobdoe@mailinator.com", function(done) {});
    }
});