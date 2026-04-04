const fs = require('fs');
const path = require('path');

// Dynamically import all files from funcs directory
const helpers = {};
const funcsPath = path.join(__dirname, 'funcs');
const funcFiles = fs.readdirSync(funcsPath).filter(file => file.endsWith('.js'));

for (const file of funcFiles) {
    const moduleExports = require(path.join(funcsPath, file));
    Object.assign(helpers, moduleExports);
}

module.exports = helpers;