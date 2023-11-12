const { model, Schema } = require("mongoose")
module.exports = model("user", new Schema(
    {
        username: String,
        token: String,
        server: String,
        ip: String
    }
))