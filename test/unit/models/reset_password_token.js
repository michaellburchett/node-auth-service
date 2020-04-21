const User = require('../../../lib/models/user.js');
const ResetPasswordToken = require('../../../lib/models/reset_password_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var assert = require('assert');

describe('Test Successful ResetPasswordToken Functions', function() {
    before(async () => {
        test_data = await add_test_data();
    })

    describe('fetch', function() {
        it('should fetch a ResetPasswordToken by ID', async function() {
            var token = await (new ResetPasswordToken).fetch(test_data.user_1.token.id);
            assert.equal(token.token, test_data.user_1.token.token);
        });
    });

    describe('fetchByField', function() {
        it('should fetch a ResetPasswordToken by a Field and Value', async function() {
            var token = await (new ResetPasswordToken).fetchByField("token",test_data.user_1.token.token);
            assert.equal(token.token, test_data.user_1.token.token);
        });
    });

    describe('create', function() {
        it('should create a ResetPasswordToken and return it', async function() {
            
            var date = new Date();
            var expiration_date = date.setDate(date.getDate() + 1); 

            var token = await (new ResetPasswordToken).create({
                token: "testing_addition",
                expiration_date: expiration_date,
                is_used: false,
                user_id: test_data.user_1.id,
            });
            assert.equal(token.token, "testing_addition");
        });
    });

    describe('update', function() {
        it('should update a ResetPasswordToken by ID', async function() {
            var token = await (new ResetPasswordToken).update(test_data.user_1.token.id,"is_used",true);
            assert.equal(token.is_used, true);
        });
    });

    describe('updateByField', function() {
        it('should update a ResetPasswordToken by search field and value, and update based on update field and value', async function() {
            var token = await (new ResetPasswordToken).updateByField("token","testing_addition","is_used",false);
            assert.equal(token.is_used, false);
        });
    });

    describe('delete', function() {
        it('should delete a ResetPasswordToken by ID and return true', async function() {
            var success = await (new ResetPasswordToken).delete(test_data.user_1.token.id);
            assert.equal(success, true);
        });
    });

    describe('deleteByField', function() {
        it('should delete a ResetPasswordToken by field and value and return true', async function() {
            var success = await (new ResetPasswordToken).deleteByField("token","testing_addition");
            assert.equal(success, true);
        });
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'janedoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() + 1); 

        var token_data = await (new ResetPasswordToken).create({
            token: 'reset_code',
            expiration_date: expiration_date,
            is_used: false,
            user_id: user_data.id
        });

        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password',
                token: {
                    id: token_data.id,
                    token: token_data.token,
                    expiration_date: token_data.expiration_date,
                    is_used: token_data.is_used
                },
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).delete(test_data.user_1.id);
    }
});