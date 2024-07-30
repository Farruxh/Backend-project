class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.message = message
        this.success = false
        this.data = data
        this.errors = errors
    }
}

export {ApiError}