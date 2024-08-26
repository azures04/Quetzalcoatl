const crypto = require("crypto")
const os = require("os")
const { execSync } = require("child_process")

function getDiskSerial() {
    try {
        const output = execSync("wmic diskdrive get serialnumber").toString()
        const serial = output.split("\n")[1].trim()
        return serial
    } catch (error) {
        console.error("Erreur lors de la récupération du numéro de série du disque:", error)
        return ""
    }
}

function getMotherboardSerial() {
    try {
        const output = execSync("wmic baseboard get serialnumber").toString()
        const serial = output.split("\n")[1].trim()
        return serial
    } catch (error) {
        console.error("Erreur lors de la récupération du numéro de série de la carte mère:", error)
        return ""
    }
}

function getMacAddresses() {
    const networkInterfaces = os.networkInterfaces()
    const macs = []

    for (const iface of Object.values(networkInterfaces)) {
        for (const nic of iface) {
            if (!nic.internal && nic.mac !== "00:00:00:00:00:00") {
                macs.push(nic.mac)
            }
        }
    }

    return macs.join("")
}

function generateHWID() {
    const diskSerial = getDiskSerial()
    const motherboardSerial = getMotherboardSerial()
    const macAddresses = getMacAddresses()
    const cpuInfo = os.cpus().map(cpu => cpu.model).join("")
    const user = os.userInfo().username

    const uniqueData = `${diskSerial}-${motherboardSerial}-${macAddresses}-${cpuInfo}-${user}`
    const hwid = crypto.createHash("sha256").update(uniqueData).digest("hex")

    return hwid
}

function main() {
    const hwid = generateHWID()
    console.log(`Generated HWID: ${hwid}`)
}

main()
