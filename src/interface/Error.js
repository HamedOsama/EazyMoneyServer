class ServerError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
  static badRequest(code, message) {
    return new ServerError(code, message);
  }
  static internalError(message) {
    return new ServerError(500, message);
  }
}

module.exports = ServerError;