const { model, Schema } = require("mongoose")
module.exports = model("ipban", new Schema(
    {
        ip: String
    }
))