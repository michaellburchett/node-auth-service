class Validator {
    parentSuccess() {
        return {
            success: true,
        };
    }

    parentFailure(message) {
        return {
            success: false,
            message: message
        };
    }
}
module.exports = Validator;