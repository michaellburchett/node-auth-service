const User = require('../../../lib/models/user.js');
const AuthorizationCode = require('../../../lib/models/authorization_code.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var assert = require('assert');

describe('Test Successful AuthorizationCode Functions', function() {
    before(async () => {
        test_data = await add_test_data();
    })

    describe('fetch', function() {
        it('should fetch a AuthorizationCode by ID', async function() {
            var code = await (new AuthorizationCode).fetch(test_data.user_1.code.id);
            assert.equal(code.code, test_data.user_1.code.code);
        });
    });

    describe('fetchByField', function() {
        it('should fetch a AuthorizationCode by a Field and Value', async function() {
            var code = await (new AuthorizationCode).fetchByField("code",test_data.user_1.code.code);
            assert.equal(code.code, test_data.user_1.code.code);
        });
    });

    describe('create', function() {
        it('should create a AuthorizationCode and return it', async function() {

            var code = await (new AuthorizationCode).create({
                code: "testing_addition",
                client_id: 'abc123',
                redirectURI: "http://www.bing.com",
                ares_scope: "*",
                user_id: test_data.user_1.id
            });
            assert.equal(code.code, "testing_addition");
        });
    });

    describe('update', function() {
        it('should update a AuthorizationCode by ID', async function() {
            var code = await (new AuthorizationCode).update(test_data.user_1.code.id,"code","testing_update");
            assert.equal(code.code, "testing_update");
        });
    });

    describe('updateByField', function() {
        it('should update a AuthorizationCode by search field and value, and update based on update field and value', async function() {
            var code = await (new AuthorizationCode).updateByField("code","testing_addition","code","testing_addition_updated");
            assert.equal(code.code, "testing_addition_updated");
        });
    });

    describe('delete', function() {
        it('should delete a AuthorizationCode by ID and return true', async function() {
            var success = await (new AuthorizationCode).delete(test_data.user_1.code.id);
            assert.equal(success, true);
        });
    });

    describe('deleteByField', function() {
        it('should delete a AuthorizationCode by field and value and return true', async function() {
            var success = await (new AuthorizationCode).deleteByField("client_id","abc123");
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

        var token_data = await (new AuthorizationCode).create({
            code: 'auth_code',
            client_id: 'abc123',
            redirectURI: "http://www.google.com",
            ares_scope: "*",
            user_id: user_data.id,
        });

        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password',
                code: {
                    id: token_data.id,
                    code: token_data.code,
                    client_id: token_data.client_id,
                    redirectURI: token_data.redirectURI,
                    ares_scope: token_data.ares_scope,
                    user_id: token_data.user_id
                },
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).delete(test_data.user_1.id);
    }
});