const express = require("express")
const app = express()
const user = require("../database/models/user")
const passport = require('passport');
const messages = require("../database/models/message")
const config = require("../../config.json")
let avaibleServers = ["server1"]
const swears = ["admin","system", "live", "livechat", "discord", "omegle", "hentai", "pornhub"];
const ipban = require("../database/models/ipban.js")

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.get('/', async(req,res) => res.json({hello:"world"}))

app.get('/messages/:serverId', async(req,res) => {
    if(!req.user) return {error: 'FalseLogin', message: 'Are you sure you are logged in?'}
    let alme = await messages.find({ chatID: req.params.serverId }).sort({ timestamp: -1 }).limit(500).select('-__v -_id -data.user.ip')
    return res.json({result:alme})
})
app.get('/users/me', async (req, res) => {
    if(!req.user) return res.status(403).json({ error: 'FalseLogin', message: 'Are you sure you are logged in?' })
    const userIp = req.socket.remoteAddress.replaceAll("::ffff:").replaceAll("undefined","")
    const isBanned = await ipban.findOne({ ip: userIp })
    if(isBanned) return res.status(403).json({ error: 'FalseLogin', message: 'Your IP has been banned.' })
    return res.status(200).json(req.user)
});

app.post('/connectServerGuest', async(req,res) => { 
    const userIp = req.socket.remoteAddress.replaceAll("::ffff:", "").replaceAll("undefined","")
    const isBanned = await ipban.findOne({ ip: userIp })
    if(isBanned) return res.status(403).json({ error: 'IPBanned', message: 'Your IP has been banned.' })   
    if(req.user) return res.redirect('/chat')
    if (!req.body.username) return res.status(400).json({ code: "MissingUsername", message: "The 'username' property is missing from the request body" });
    if (!req.body.server) return res.status(400).json({ code: "MissingServer", message: "The 'server' property is missing from the request body" });
    if (swears.some(keyword => req.body.username.toLowerCase().includes(keyword.toLowerCase()))) return res.status(403).json({ code: "CannotUseThisUsername", message: "This username is not supported" });
    if(!avaibleServers.includes(req.body.server)) return res.status(403).json({code:"ServerIsNotAvaible", message: "The server you want to connect to is currently unavaible"})
    if((await user.find({})).length > 50) return res.status(403).json({code:"ServerIsFull", message: "The server you want to connect to is currently full"})
    let all = await user.find({})
    let varmi = false
    all.forEach(async(x) => {
        if(x.username.toLowerCase() == req.body.username.toLowerCase()) return varmi = true
    })
    if(varmi) return res.status(403).json({code:"UsernameIsTaken", message: "This username is already taken"})
    let am = generateRandomToken()
    let object = {username: req.body.username, token: am.replaceAll("=",""), server: req.body.server, ip: userIp}
    await new user(object).save()
    let amc =  { ws: config.ws, user: object, nonce: Date.now() }
    req.login(amc, async(err)=> res.redirect(err ? '/error' : '/chat'))
})
app.get('/users', async(req,res) => {
    let users = await user.find({}).select('-__v -_id -token')
    res.json({result:users})
})

app.all('*', async (req, res) => res.status(405).json({ code: 'MethodNotAllowed', message: `${req.method} not allowed` }));

app.use((req,res) => res.json({code: "ResourceNotFound", message: `${req.url} does not exist`}));

module.exports = app

function generateRandomToken() {
    return `${btoa(Date.now())}.${[...Array(4)].map(() => Math.random().toString(36)[2]).join('')}.live.${[...Array(40)].map(() => Math.random().toString(36)[2]).join('')}`;
}
