const User = require('../../../lib/models/user.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var assert = require('assert');

describe('Test Successful User Functions', function() {
    before(async () => {
        test_data = await add_test_data();
    })

    describe('fetch', function() {
        it('should fetch a User by ID', async function() {
            var user = await (new User).fetch(test_data.user_1.id);
            assert.equal(user.email, test_data.user_1.email);
        });
    });

    describe('fetchByField', function() {
        it('should fetch a User by a Field and Value', async function() {
            var user = await (new User).fetchByField("email",test_data.user_1.email);
            assert.equal(user.email, test_data.user_1.email);
        });
    });

    describe('create', function() {
        it('should create a User and return it', async function() {
            var user = await (new User).create({
                email: "jasperdoe@mailinator.com",
                password: bcrypt.hashSync("Password123", bcrypt.genSaltSync(saltRounds))
            });
            assert.equal(user.email, "jasperdoe@mailinator.com");
        });
    });

    describe('update', function() {
        it('should update a User by ID', async function() {
            var user = await (new User).update(test_data.user_1.id,"email","testupdate@test.com");
            assert.equal(user.email, "testupdate@test.com");
        });
    });

    describe('updateByField', function() {
        it('should update a User by search field and value, and update based on update field and value', async function() {
            var user = await (new User).updateByField("email","testupdate@test.com","password","Password456");
            assert.equal(user.password, "Password456");
        });
    });

    describe('delete', function() {
        it('should delete a User by ID and return true', async function() {
            var success = await (new User).delete(test_data.user_1.id);
            assert.equal(success, true);
        });
    });

    describe('deleteByField', function() {
        it('should delete a User by field and value and return true', async function() {
            var success = await (new User).deleteByField("email","jasperdoe@mailinator.com");
            assert.equal(success, true);
        });
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jermiahdoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var package = {
            user_1: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password'
            }
        }

        return package;
    }

    async function remove_test_data() {
        //Nothing to clean up
    }
});