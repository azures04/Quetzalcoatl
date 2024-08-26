const bodyParser = require("body-parser")
const express = require("express")
const path = require("path")
const server = require("http").createServer(app)
const config = require("./config.json")
const crypto = require("crypto")
const app = express()
const io = require("socket.io")(server)
const fs = require("fs")
const connectedLaunchers = {}

const jsonParser = bodyParser.json()

app.get("/api/updates/channels", (req, res) => {
    const channelsList = fs.readdirSync(path.join(__dirname, "channels"))
    res.json(channelsList)
})

app.get("/api/updates/channel/:channelName", jsonParser, (req, res) => {
    const { channelName, filePath } = req.params
    if (channelName != "banned") {
        if (req.body.hwid && !isUserBanned(req.body.hwid)) {
            if (fs.existsSync(path.join(__dirname, "channels", channelName, "whitelist.json"))) {
                const whitelist = JSON.parse(fs.readFileSync(path.join(__dirname, "channels", channelName, "whitelist.json")))
                if (req.body.hwid) {
                    if (whitelist.hwids.includes(req.body.hwid)) {
                        res.json(scanDirectorySync(path.join("channels", channelName, "code"), channelName))

                    } else {
                        res.status(403).json({
                            error: {
                                code: 403,
                                message: "You're not authorized to use this deployment/updating channel"
                            }
                        }) 
                    }
                } else {
                    res.status(422).json({
                        error: {
                            code: 422,
                            message: "Missing the HWID in the body of the request"
                        }
                    })
                }
            } else {
                res.json(scanDirectorySync(path.join("channels", channelName, "code"), channelName))
            }
        }
    } else {
        res.sendFile(path.join(__dirname, "channels", "banneds", "code", filePath))
    }
})

app.get("/api/updates/channel/:channelName/download/:filePath", jsonParser, (req, res) => {
    const { channelName, filePath } = req.params
    if (channelName != "banned") {
        if (req.body.hwid && !isUserBanned(req.body.hwid)) {
            if (fs.existsSync(path.join(__dirname, "channels", channelName, "whitelist.json"))) {
                const whitelist = JSON.parse(fs.readFileSync(path.join(__dirname, "channels", channelName, "whitelist.json")))
                if (req.body.hwid) {
                    if (whitelist.hwids.includes(req.body.hwid)) {
                        if (fs.existsSync(path.join(__dirname, "channels", channelName, "code", filePath))) {
                            res.sendFile(path.join(__dirname, "channels", channelName, "code", filePath))
                        } else {
                            res.status(404).json({
                                error: {
                                    code: 404,
                                    message: "File not found or removed"
                                },
                                skip: true
                            }) 
                        }
                    } else {
                        res.status(403).json({
                            error: {
                                code: 403,
                                message: "You're not authorized to use this deployment/updating channel"
                            }
                        }) 
                    }
                } else {
                    res.status(422).json({
                        error: {
                            code: 422,
                            message: "Missing the HWID in the body of the request"
                        }
                    })
                }
            } else {
                if (fs.existsSync(path.join(__dirname, "channels", channelName, "code", filePath))) {
                    res.sendFile(path.join(__dirname, "channels", channelName, "code", filePath))
                } else {
                    res.status(404).json({
                        error: {
                            code: 404,
                            message: "File not found or removed"
                        },
                        skip: false,
                        actions: [
                            "remove"
                        ]
                    }) 
                }
            }
        }
    } else {
        res.sendFile(path.join(__dirname, "channels", "banneds", "code", filePath))
    }
})

function calculateFileHashSync(filePath) {
    const fileBuffer = fs.readFileSync(filePath)
    const hash = crypto.createHash("sha256")
    hash.update(fileBuffer)
    return hash.digest("hex")
}

function scanDirectorySync(dirPath, channel) {
    let results = []
    const files = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name)

        if (file.isDirectory()) {
            results = results.concat(scanDirectorySync(fullPath))
        } else {
            results.push({
                url: fullPath.replace(/\\/g, "/").replace(`channels/${channel}/code/`, ""),
                hash: calculateFileHashSync(fullPath)
            })
        }
    }
    return results
}

function findKeyByValue(obj, value) {
    for (const [key, val] of Object.entries(obj)) {
        if (val === value) {
            return key
        }
    }
    return null
}

function isUserBanned(hwid) {
    const banList = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "banneds.json")))
    return banList.includes(hwid)
}

function banUser(hwid) {
    const banList = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "banneds.json")))
    if (!banList.hwids.includes(hwid)) {
        banList.hwids.push(hwid)
        fs.writeFileSync(path.join(__dirname, "db", "banneds.json"), JSON.stringify(banList, null, 4))
        return { status: "success", code: 200, message: `Computer <${hwid}> banned` }
    } else {
        return { status: "failed", code: 409, message: `Computer <${hwid}> already banned` }
    }
}

function unbanUser(hwid) {
    const banList = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "banneds.json")))
    if (banList.hwids.includes(hwid)) {
        const hwidIndex = banList.hwids.find(hwid)
        banList.hwids.splice(hwidIndex, 1)
        fs.writeFileSync(path.join(__dirname, "db", "banneds.json"), JSON.stringify(banList, null, 4))
        return { status: "success", code: 200, message: `Computer <${hwid}> unbanned` }
    } else {
        return { status: "failed", code: 409, message: `Computer <${hwid}> isn't banned` }
    }
}

io.on("connection", (socket, next) => {
    socket.on("connected", (data) => {
        connectedLaunchers[data.hwid] = socket.id
    })
    socket.on("adminAction", (data) => {
        if (config.tokens.includes(data.token)) {
            socket.to(connectedLaunchers[data.computer_hwid]).emit("action", { data: data.data })
        } else {
            next()
        }
    })
    socket.on("ban", (data) => {
        if (config.tokens.includes(data.token)) {
            banUser(data.computer_hwid)
            socket.to(connectedLaunchers[data.computer_hwid]).emit("forceUpdate")
        } else {
            next()
        }
    })
    socket.on("disconnect", () => {
        const hwid = findKeyByValue(connectedLaunchers, socket.id)
        connectedLaunchers[hwid] = undefined
    })
})

server.listen(config.port, () => {
    console.log("Server listening at port : " + config.port)
})

