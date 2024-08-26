
const path = require("path")
const crypto = require("crypto")
const fs = require("fs")

function calculateFileHashSync(filePath) {
    const fileBuffer = fs.readFileSync(filePath)
    const hash = crypto.createHash("sha256")
    hash.update(fileBuffer)
    return hash.digest("hex")
}

function scanDirectorySync(dirPath) {
    let results = []
    const files = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name)

        if (file.isDirectory()) {
            results = results.concat(scanDirectorySync(fullPath))
        } else {
            results.push({
                url: fullPath,
                hash: calculateFileHashSync(fullPath)
            })
        }
    }
    return results
}

console.log(scanDirectorySync(path.join(__dirname, "channels")))