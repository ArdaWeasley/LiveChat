const { model, Schema } = require("mongoose")
module.exports = model("message", new Schema(
    {
        messageID: String,
        nonce: String,
        author: String,
        chatID: String,
        type: {type:Number, default: 0},
        timestamp: String,
        data: Array,
        date: {type:Date, default: new Date()}
    }
))