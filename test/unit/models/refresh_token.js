const User = require('../../../lib/models/user.js');
const RefreshToken = require('../../../lib/models/refresh_token.js');
const AccessToken = require('../../../lib/models/access_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var assert = require('assert');

describe('Test Successful RefreshToken Functions', function() {
    before(async () => {
        test_data = await add_test_data();
    })

    describe('fetch', function() {
        it('should fetch a RefreshToken by ID', async function() {
            var token = await (new RefreshToken).fetch(test_data.user_1.access_token.refresh_token.id);
            assert.equal(token.token, test_data.user_1.access_token.refresh_token.token);
        });
    });

    describe('fetchByField', function() {
        it('should fetch a RefreshToken by a Field and Value', async function() {
            var token = await (new RefreshToken).fetchByField("token",test_data.user_1.access_token.refresh_token.token);
            assert.equal(token.token, test_data.user_1.access_token.refresh_token.token);
        });
    });

    describe('create', function() {
        it('should create a RefreshToken and return it', async function() {

            var token = await (new RefreshToken).create({
                token: "testing_addition",
                client_id: test_data.user_1.access_token.refresh_token.client_id,
                user_id: test_data.user_1.id,
                access_token_id: test_data.user_1.access_token.id
            });
            assert.equal(token.token, "testing_addition");
        });
    });

    describe('update', function() {
        it('should update a RefreshToken by ID', async function() {
            var token = await (new RefreshToken).update(test_data.user_1.access_token.refresh_token.id,"token","testing_update");
            assert.equal(token.token, "testing_update");
        });
    });

    describe('updateByField', function() {
        it('should update a RefreshToken by search field and value, and update based on update field and value', async function() {
            var token = await (new RefreshToken).updateByField("token","testing_update","token","testing_update_updated");
            assert.equal(token.token, "testing_update_updated");
        });
    });

    describe('delete', function() {
        it('should delete a RefreshToken by ID and return true', async function() {
            var success = await (new RefreshToken).delete(test_data.user_1.access_token.refresh_token.id);
            assert.equal(success, true);
        });
    });

    describe('deleteByField', function() {
        it('should delete a RefreshToken by field and value and return true', async function() {
            var success = await (new RefreshToken).deleteByField("token","testing_addition");
            assert.equal(success, true);
        });
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jeremiahdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var date = new Date();
        var expiration_date = date.setDate(date.getDate() + 1); 

        var access_token_data = await (new AccessToken).create({
            token: 'access_token',
            expiration_date: expiration_date,
            user_id: user_data.id,
            client_id: 'abc123'
        });

        var refresh_token_data = await (new RefreshToken).create({
            token: 'refresh_token',
            client_id: 'abc123',
            user_id: user_data.id,
            access_token_id: access_token_data.id
        });

        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password',
                access_token: {
                    id: access_token_data.id,
                    token: access_token_data.token,
                    expiration_date: access_token_data.expiration_date,
                    user_id: access_token_data.id,
                    client_id: access_token_data.client_id,
                    refresh_token: {
                        id: refresh_token_data.id,
                        token: refresh_token_data.token,
                        client_id: refresh_token_data.client_id,
                        user_id: refresh_token_data.user_id
                    }
                },
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).delete(test_data.user_1.id);
        await (new AccessToken).delete(test_data.user_1.access_token.id);
    }
});