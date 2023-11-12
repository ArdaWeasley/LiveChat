const mongo = require("mongoose")
module.exports = async (url) => {
    try {
        const start = new Date()
        await mongo.connect(url, {
            autoIndex: false,
        });

        const end = new Date()
        console.log(`[DATABASE] Bağlanıldı. ${end-start}ms`)
    } catch (e) {
        console.error("Bağlanamadı"+e)
    }
}