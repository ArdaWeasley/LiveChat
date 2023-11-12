// This system is still not finished, only the model is available
const { model, Schema } = require("mongoose")
module.exports = model("chat", new Schema(
    {
        chatID: String,
        type: {type:Number, default: 0},
        chatInfo:{
            users: {
                type: Array,
                default: {
                    username: String,
                    usertoken: String,
                    userid: String
                }
            }
        },
        createdAt: {type:Date, default: new Date()},
        serverID: Number
    }
))
