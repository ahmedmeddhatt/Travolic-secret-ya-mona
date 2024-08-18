export class ResponseHandler {
  status_code: number;
  message: string;
  errorMessages: any[];
  data: any;
  token: string;
  constructor() {
    // Asign Default Value
    this.status_code = 200;
    this.message = null;
    this.errorMessages = [];
    this.data = null;
    this.token = null;
  }

  // Status Code Setter
  setStatusCode(status_code) {
    this.status_code = status_code;
    return this;
  }

  // Status Code Getter
  getStatusCode() {
    return this.status_code;
  }

  // Error Messages Setter
  setErrorMessages(message) {
    this.errorMessages = message;
    return this;
  }

  // Error Messages Getter
  getErrorMessages() {
    return this.errorMessages;
  }

  // Status Messages Setter
  setStatusMessage(message) {
    this.message = message;
    return this;
  }

  // Status Messages Getter
  getStatusMessage() {
    return this.message;
  }

  // Data Setter
  setData(data) {
    this.data = data;
    return this;
  }

  // Data Getter
  getData() {
    return this.data;
  }

  // Token Setter
  setToken(token) {
    this.token = token;
    return this;
  }

  // Token Getter
  getToken() {
    return this.token;
  }

  // Server Error Respond
  /*
    # Server Error
    = Return when an internal Server Error occruued
    @Message Param can assign to whatever error message you want
  */
  serverError(messages = [{ path: null, message: 'Error occurred' }]) {
    return this.setStatusCode(500).setErrorMessages(messages).respond();
  }
  // Respond
  /*
    # Respond
    = In success case, This is the response that will send,
    @Token is a boolean param, pass true when you want to send back a token
  */
  respond(token = false) {
    if (token == true) {
      return {
        status_code: this.getStatusCode(),
        message: this.getStatusMessage(),
        data: this.getData(),
        token: this.getToken()
      };
    }
    return {
      status_code: this.getStatusCode(),
      message: this.getStatusMessage(),
      data: this.getData()
    };
  }
  // Respond Errors
  /*
    # Respond Errors
    = in case of faild with custome Errors
  */
  respondErrors() {
    return {
      status_code: this.getStatusCode(),
      errorMessage: this.getErrorMessages()
    };
  }
  // notFoundError
  /*
    # notFoundError
    = Not Found Error referre to 400 Bad Request state
  */
  notFoundError() {
    return {
      status_code: this.setStatusCode(400),
      errorMessage: this.setErrorMessages([
        {
          path: null,
          message: 'خطأ في الأرسال'
        }
      ])
    };
  }
}
