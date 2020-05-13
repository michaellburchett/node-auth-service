var assert = require('assert');

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../lib/index.js');
const User = require('../../lib/models/user.js');
const AccessToken = require('../../lib/models/access_token.js');
const RefreshToken = require('../../lib/models/refresh_token.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

chai.use(chaiHttp);

describe('Client Credentials Exchange', function() {
    
    before(async () => {
        test_data = await add_test_data();
    })

    describe('client credentials endpoint success', function() {
        
        it('should successfully generate a new Access Token when given valid Client Credentials', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'ssh-secret')
            .send({
                grant_type: 'client_credentials'
            })
            .end(async (err, res) => {
                res.should.have.status(200);
                assert(res.body.access_token);

                await (new RefreshToken).deleteByField("token",res.body.access_token.refresh_token);
                await (new AccessToken).deleteByField("token",res.body.access_token.token);
            });
        }).timeout(10000);
    });

    describe('client credentials endpoint failure', function() {
        
        it('should successfully message user when the password is incorrect', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc123', 'hush-secret')
            .send({
                grant_type: 'client_credentials'
            })
            .end(async (err, res) => {
                res.should.have.status(500);
            });
        }).timeout(10000);

        it('should successfully message user when the client is incorrect', async function() {
            chai.request(app)
            .post('/oauth/token')
            .auth('abc456', 'ssh-secret')
            .send({
                grant_type: 'client_credentials'
            })
            .end(async (err, res) => {
                res.should.have.status(500);
            });
        }).timeout(10000);
    });

    after(async () => {
        await remove_test_data();
    })

    async function add_test_data() {

        var user_data = await (new User).create({
            email: 'jansportdoe@mailinator.com',
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
        await (new User).deleteByField("email","jansportdoe@mailinator.com");
    }
});