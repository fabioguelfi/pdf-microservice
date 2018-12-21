
const bodyParser = require('body-parser')
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const upload = multer({ dest: `${process.env.TEMP}/tmp` })
const { writeTemplate, generatePDF, deleteFolderRecursive } = require('./services/pdf.service')
const server = express()
const router = express.Router()

// Middlewares
// server.use(bodyParser.text({ limit: '50mb' }))
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json());

// Routes
router.route('/pdf').post(upload.single('template'), async (req, res) => {
    const { path, filename } = req.file
    await writeTemplate(path)
    await generatePDF(filename, req.body.payloads)
    await res.contentType("application/pdf")
    res.download(`${process.env.TEMP}/${filename}/document.pdf`, 'template', (e) => {
        fs.unlinkSync(path)
        deleteFolderRecursive(`${process.env.TEMP}/${filename}`)
    })
})

router.route('/stats/health').get((req, res) => res.sendStatus(200))

server.use('/api', router)

module.exports = server

