var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../lib/index.js');
const User = require('../../lib/models/user.js');
const AccessToken = require('../../lib/models/access_token.js');
const AccessTokenOwnership = require('../../lib/models/access_token_ownership.js');
const RefreshToken = require('../../lib/models/refresh_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);

describe('Password Exchange', function() {
    
    before(async () => {
        test_data = await add_test_data();
    })

    describe('username and password endpoint success', function() {
        
        it('should successfully generate a new Access Token when given valid Username and Password', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'password',
                username: test_data.user.email,
                password: '123Password'
            })
            .end(async (err, res) => {

                res.should.have.status(200);
                assert(res.body.access_token);

                var access_token = await (new AccessToken).fetchByField("token",res.body.access_token.token);

                await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                await (new AccessTokenOwnership).deleteByField("access_token_id",access_token.id);
                await (new AccessToken).deleteByField("token",res.body.access_token.token);
            });
        }).timeout(10000);
    });

    describe('username and password endpoint failure', function() {
        
        it('should return an error if a users email cannot be found', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'password',
                username: 'wrongemail@test.com',
                password: '123Password'
            })
            .end(async (err, res) => {

                res.should.have.status(403);
            });
        }).timeout(10000);

        it('should return an error if a users password is incorrect', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'password',
                username: test_data.user.email,
                password: '456password'
            })
            .end(async (err, res) => {

                res.should.have.status(403);
            });
        }).timeout(10000);

    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jacklindoe@mailinator.com',
            password: bcrypt.hashSync('123Password', bcrypt.genSaltSync(saltRounds))
        })

        var package = {
            user: {
                id: user_data.id,
                email: user_data.email,
                password: '123Password'
            }
        }

        return package;
    }

    async function remove_test_data() {
        await (new User).deleteByField("email",test_data.user.email);
    }
});