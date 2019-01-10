const fs = require('fs')
const unzip = require('unzip-stream')
const puppeteer = require('puppeteer')
const fsExtra = require('fs-extra')
const hbs = require('handlebars')
const path = require('path')
const createHTML = require('create-html')

const resolveStream = (readStream, writeStream, eventFinish = 'finish') => {
    return new Promise((resolve, reject) => {
        const stream = readStream.pipe(writeStream)
        stream.on(eventFinish, () => {
            return resolve()
        })
        stream.on(`error`, (e) => {
            return reject(e)
        })
    })
}

const writeTemplate = async (directory) => {
    const readFs = fs.createReadStream(directory)
    const readFsPath = readFs.path
    const basename = path.basename(readFsPath)

    const _path = path.resolve(`${process.env.TEMP}`)
    await resolveStream(readFs, unzip.Extract({ path: `${_path}/${basename}` }), 'close')
}

const deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path + "/" + file
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath)
            } else { // delete file
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(path)
    }
}

const generatePDF = async (templateName, payloads) => {
    if (!templateName || !payloads) return
    payloads = JSON.parse(payloads)
    await Promise.all(payloads.objects.map(async (object) => {

        const compile = async (templateName, object) => {
            const filePath = await path.join(`${process.env.TEMP}/${templateName}`, `index.hbs`)
            const html = await fsExtra.readFile(filePath, 'utf-8')
            return hbs.compile(html)(object)
        }

        return (async () => {
            try {

                i = 0

                const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: true, args: ['--no-sandbox'] })
                const page = await browser.newPage()

                const content = await compile(templateName, object)
                const html = createHTML({
                    title: templateName,
                    scriptAsync: true,
                    lang: 'pt-br',
                    head: `<meta name="description" content="${templateName}">`,
                    body: content
                })

                fs.writeFileSync(`${process.env.TEMP}/${templateName}/index.html`, html)
                await page.goto(`file://${process.env.TEMP}/${templateName}/index.html`)
                await page.emulateMedia('screen')
                await page.pdf({
                    path: path.resolve(`${process.env.TEMP}/${templateName}/document.pdf`),
                    format: 'A4',
                    printBackground: true,
                    waitUntil: 'networkidle',
                })

                i++

                console.log(`### DONE ###`)
                payloads.objects.forEach(payload => console.log(payload))
                console.log(`### --- ###`)
                await browser.close()
                // process.exit()
            } catch (e) {
                console.log('error!', e)
            }

        })()


    }))

}

module.exports = { writeTemplate, generatePDF, deleteFolderRecursive } 