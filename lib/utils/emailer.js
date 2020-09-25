const nodemailer = require("nodemailer");

module.exports.transport = function(recipient, user_id, token, callback) {
    var transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
    });
      
    var mailOptions = {
        from: process.env.MAIL_FROM,
        to: recipient,
        subject: 'Reset your account password',
        text: '<h4><b>Reset Password</b></h4>' +
        '<p>To reset your password, click the following link:</p>' +
        '<a href=' + process.env.APP_URL + '/reset-password?user_id=' + user_id + '&reset_password_token=' + token + '">' +
        'Reset Password</a>' +
        '<br><br>' +
        '<p>--Team</p>'
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log('Message NOT sent: %s', error);
          callback(false);
        } else {
          console.log('Message sent: %s', info.messageId);
          callback(true);
        }
    });
}