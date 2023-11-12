const app = require('express').Router()
const chat = require("./src/database/models/room")

app.get('/', async (req,res) => {
      return res.render('index.ejs', { req,res});
})

app.get('/chat', async(req,res) => {
      return res.render('chat.ejs', {req,res})
})

app.get('/manifest.json', async(req,res) => {
      return res.json({
            name: "Live Chat App",
            short_name: "Live Chat",
            start_url: "/",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#000000",
            icons: [
                  {
                        src: "/assets/image/logo.png",
                        sizes: "512x512",
                        type: "image/png"
                  }
            ]
      });
})



module.exports = app
