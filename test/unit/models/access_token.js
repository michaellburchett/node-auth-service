const User = require('../../../lib/models/user.js');
const AccessToken = require('../../../lib/models/access_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var assert = require('assert');

describe('Test Successful AccessToken Functions', function() {
    before(async () => {
        test_data = await add_test_data();
    })

    describe('fetch', function() {
        it('should fetch a AccessToken by ID', async function() {
            var token = await (new AccessToken).fetch(test_data.user_1.token.id);
            assert.equal(token.token, test_data.user_1.token.token);
        });
    });

    describe('fetchByField', function() {
        it('should fetch a AccessToken by a Field and Value', async function() {
            var token = await (new AccessToken).fetchByField("token",test_data.user_1.token.token);
            assert.equal(token.token, test_data.user_1.token.token);
        });
    });

    describe('create', function() {
        it('should create a AccessToken and return it', async function() {
            
            var date = new Date();
            var expiration_date = date.setDate(date.getDate() + 1); 

            var token = await (new AccessToken).create({
                token: "testing_addition",
                expiration_date: expiration_date,
                user_id: test_data.user_1.id,
                client_id: 'abc123'
            });
            assert.equal(token.token, "testing_addition");
        });
    });

    describe('update', function() {
        it('should update a AccessToken by ID', async function() {
            var token = await (new AccessToken).update(test_data.user_1.token.id,"token","testing_updated");
            assert.equal(token.token, "testing_updated");
        });
    });

    describe('updateByField', function() {
        it('should update a AccessToken by search field and value, and update based on update field and value', async function() {
            var token = await (new AccessToken).updateByField("token","testing_updated","token","testing_updated_updated");
            assert.equal(token.token, "testing_updated_updated");
        });
    });

    describe('delete', function() {
        it('should delete a AccessToken by ID and return true', async function() {
            var success = await (new AccessToken).delete(test_data.user_1.token.id);
            assert.equal(success, true);
        });
    });

    describe('deleteByField', function() {
        it('should delete a AccessToken by field and value and return true', async function() {
            var success = await (new AccessToken).deleteByField("token","testing_addition");
            assert.equal(success, true);
        });
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jackdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() + 1); 

        var token_data = await (new AccessToken).create({
            token: 'access_token',
            expiration_date: expiration_date,
            user_id: user_data.id,
            client_id: 'abc123'
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
                    user_id: token_data.user_id,
                    client_id: token_data.client_id,
                },
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).delete(test_data.user_1.id);
    }
});