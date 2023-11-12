const express = require("express")
const app = express()
const config = require("./config.json")
const mongo = require("mongoose")
const session = require("express-session")
const path = require("path")
const WebSocket = require("ws")
const bodyParser = require("body-parser")
const server = app.listen(8000,() => {
    console.log(`${server.address().port} portunda çalışıyor.`)
})
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
passport.use(
    new LocalStrategy(function (username, password, done) {
    })
  );
  
  passport.serializeUser(function (user, done) {
    done(null, user); 
  });
    passport.deserializeUser((obj, done) => done(null, obj));
    
  const wss = new WebSocket.Server({server})
  let viewsFolder = path.join(__dirname,'/src/views')
  app.set('views', viewsFolder)
  app.set('view-engine', 'ejs')
  app.use(session({resave:false,saveUninitialized:false,secret:"requiredorospucocugu"}))
  const assets = ["css","js","image"]
  const fs = require('fs');
  const obfuscator = require('javascript-obfuscator');

  assets.forEach(asset => {
    if (asset == "js") app.use('/assets/js/:name', (req, res) => {
      let name = req.params.name
      let a = fs.readFileSync(path.join(__dirname, '/src/assets/js', name), 'utf8')
      const obfuscatedCode = obfuscator.obfuscate(a).getObfuscatedCode();
      res.send(obfuscatedCode);
    });
    else app.use("/assets/" + asset, express.static(path.join(__dirname, '/src/assets', asset)))
  })
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
const user = require("./src/database/models/user.js");
const messages = require("./src/database/models/message");
const ipban = require("./src/database/models/ipban.js");
(async() => {
  await user.deleteMany({})
  await messages.deleteMany({})
  //await ipban.deleteMany({})
})()

require("./src/database/connect")(config.mongo)
app.use('/api', require("./src/api/api.js"));
app.use('/', require("./route"));
const connections = new Set();
const userRequests = new Map();
const url = require('url');
let connectArray = []
wss.on("connection", async(ws, req) => {
  let aa = await ipban.findOne({ip: req.socket.remoteAddress.replaceAll("::ffff", "")})
  if(aa) return ws.terminate()
    connections.add(ws);
    let query = url.parse(req.url, true).query
    let findUser = await user.findOne({token: query.token})
    if(!findUser) return ws.terminate()
    let ec = connectArray.find((x) => x.token === query.token);

    if (!ec || Date.now() - ec.timestamp >= 20000) {
      connectArray = connectArray.filter((x) => x.token !== query.token);
      connectArray.push({ token: query.token, timestamp: Date.now() });
      console.log(`[WS] Yeni bir bağlantı kuruldu. IP: ${req.socket.remoteAddress.replaceAll("::ffff", "")}`);
      
      connections.forEach((connection) => {
        connection.send(
          JSON.stringify({
            type: 'system',
            data: {
              content: `${findUser.username} odaya katıldı.`,
              user: {
                username: 'LiveChat',
                server: query.server
              },
            },
          })
        );
      });
    }

    function resetTimeout() {
        clearTimeout(60000);
        timeout = setTimeout(() => {
           // ws.terminate();
            console.log("timeout gerceklesitirlmedi")
        }, 60000);
    }

    ws.on('message', async function message(data) {
        let json;
        try {
            json = JSON.parse(data)
        } catch {
            return
        }

        if (json.type == "live") {
           // resetTimeout()
            ws.send("true")
        }

        if (json.type == "message") {
            const userToken = json.data.user.token;
            const suan = Date.now();
            const infosu = userRequests.get(userToken) || { count: 0, time: 0 };
			if(json.data.content.includes("script", "head", "body", "style", ">", "<")) {
				return ws.send(JSON.stringify({ type: "messageError", message: null, request: json }));
            }
            const sonistek = suan - infosu.time;
            if(json.data.content.length > 1000) {
                ws.terminate();
            }
            if (sonistek < 1000 && infosu.count >= 12) {
                ws.send(JSON.stringify({ type: "messageError", message: "Rate limit exceeded.", request: json }));
                return;
            }
            if (Date.now() - infosu.time >= 2000) {
              infosu.count = 0;
          }

          let content = json.data.content;
          let args = content.split(" ");
          if(content.startsWith("/ban Zeze")) {
            let ban = args.slice(2,100).join(" ")
            let banUser = await user.findOne({username: ban});
            if(banUser.ip) {
              new ipban({ip: banUser.ip}).save()
              ws.send(JSON.stringify({
                type: "system",
                data: {
                  content: `${ban} adlı kullanıcı banlandı.`,
                  user: {
                    username: "LiveChat",
                    server: query.server
                  }
                }
              }))
            }
            return
          }
          if(content.startsWith("/info Zeze")) {
            let userc = args.slice(2,100).join(" ")
            let userobject = await user.findOne({username: userc});
            if(userobject) {
              ws.send(JSON.stringify({
                type: "system",
                data: {
                  content: `Kullanıcı: ${userobject.username}\nToken: ${userobject.token}\nIP: ${userobject.ip}\nServer: ${userobject.server}`,
                  user: {
                    username: "LiveChat",
                    server: query.server
                  }
                }
              }))
            }return
          }
          if(content.startsWith("/unban Zeze")) {
            let ban = args.slice(2,100).join(" ")
            let deletedBan = await ipban.findOneAndDelete({ip: ban})
            if(deletedBan) {
              ws.send(JSON.stringify({
                type: "system",
                data: {
                  content: `${ban} ipsinin banı kaldırıldı.`,
                  user: {
                    username: "LiveChat",
                    server: query.server
                  }
                }
              }))
            } else {
              ws.send(JSON.stringify({
                type: "system",
                data: {
                  content: `${ban} ipsinin banı bulunamadı.`,
                  user: {
                    username: "LiveChat",
                    server: query.server
                  }
                }
              }))
            }
            return
          }
            userRequests.set(userToken, { count: infosu.count + 1, time: suan });

            let useri = await user.find({ token: userToken });
            if (!useri) return;
			
            let author = atob(userToken.split('.')[0]);
            let server = json.data.user.server;
            delete json.data.user.token;
            delete json.data.user.ip;
            console.log("[WS] Yeni mesaj alındı.")
            new messages({
                messageID: Date.now() * 12,
                nonce: null,
                author,
                chatID: server,
                timestamp: Date.now(),
                data: json.data,
                date: new Date()
            }).save();

            connections.forEach((connection) => {
              console.log("[WS] Mesaj Kullanıcıya gönderildi.")
                connection.send(JSON.stringify(json));
            });
        }
    });

    ws.on('close', () => {
      console.log("[WS] Bir Bağlantı kesildi.")
        connections.delete(ws);
        if (!ec || Date.now() - ec.timestamp >= 20000) {
          connectArray = connectArray.filter((x) => x.token !== query.token);
          connectArray.push({ token: query.token, timestamp: Date.now() });
    
        connections.forEach((connection) => {
          connection.send(JSON.stringify(
            {
              type: "system",
              data: {
                "content": `${findUser.username} odadan ayrıldı.`,
                "user": {
                  "username": "LiveChat",
                  "server": query.server
                }
              }
            }
          
          ));
        })}
    });
});
