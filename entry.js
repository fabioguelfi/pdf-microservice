const server = require('./src/server')

const port = process.env.PORT || 7007
server.listen(port, () => console.log(`Run on Port ${port} and Dir ${__dirname}`));
