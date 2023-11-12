async function check() {
    let checkUser = await fetch("/api/users/me")
    let json = await checkUser.json()
    if (!json?.user) return window.location.href = '/'
    else return json
}
setInterval(check, 5000);


function websocketconnect() {
    (async () => {
        let a = await check()
        const ws = new WebSocket(a.ws + "?serverId=" + a.user.server + "&token=" + a.user.token);
        ws.addEventListener('close', (event) => {
            console.log("[WebSocket] Connection closed, will attempt to reconnect in 10 seconds");
            document.getElementById("warning").innerHTML = "Connection lost. Attempting to reconnect...";
            setTimeout(() => {
                websocketconnect()
            }, 10000);
        });
        ws.addEventListener('message', async (event) => {
            if (event.data == "true") return;
            let json = JSON.parse(event.data);
            const chatArea = $('#chatArea');
            console.log("%c[MessageQueue] %cNew Message: %c" + JSON.stringify(json), "color: purple;", "color: black;", "color: black;");
            if (json.type == "messageError") {
                console.log("error");
                chatArea.append(`<h3 style="color: red;">${json.request.data.user.username}: ${json.request.data.content} - ${json.message}</h3>`);
                chatArea.scrollTop(chatArea.prop("scrollHeight"));
            } else {
                let checks = await check();
                const cleanContent = DOMPurify.sanitize(json.data.content);
                const color = json.type === "system" ? "blue" : (checks.user.username === json.data.user.username ? "green" : "white");
                const messageWithLinks = cleanContent.replace(
                    /(https?:\/\/[^\s]+)/g,
                    '<a href="$1" target="_blank">$1</a>'
                );
                chatArea.append(`<h3 style="color: ${color};">${json.data.user.username}: ${messageWithLinks}</h3>`);
                chatArea.scrollTop(chatArea.prop("scrollHeight"));
                document.getElementById("warning").innerHTML = "";
            }
        });
        let r = await fetch(`/api/messages/${a.user.server}`);
        let json2 = await r.json()
        if (json2.result) {
            const chatArea = $('#chatArea');
            json2.result.sort((a, b) => a.timestamp - b.timestamp).forEach(x => {
                const cleanContent = DOMPurify.sanitize(x.data[0].content);
                chatArea.append(`<h3 style="color: ${x.data[0].user.username == a.user.username ? 'green' : 'white'};">${x.data[0].user.username}: ${cleanContent}</h3>`);
            });
            chatArea.scrollTop(chatArea.prop("scrollHeight"));
        }
        setInterval(() => {
            ws.send(JSON.stringify({ type: "live" }))
        }, 30000);
        $('#messageInput').keypress(async (e) => {
            if (e.which === 13) {
                const message = $('#messageInput').val();
                if (!message) return
                let user = (await check()).user
                let object = { type: "message", data: { content: message, user } }
                console.log("%c[MessageQueue] %cDraining Message Queue with" + JSON.stringify(object), "color: purple;", "color: black;");
                ws.send(JSON.stringify(object));
                $('#messageInput').val('');
            }
        });
    })();
}
websocketconnect()