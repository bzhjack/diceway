const fs = require('fs');
const bladeFileName = 'diceway.blade.php';
const bladeFilePath = `../resources/views/${bladeFileName}`;

const bladeFileContents = fs.readFileSync(`${bladeFilePath}`, 'utf8');


const updateLine = (line, name) => {
    return line.replaceAll('<script src="', '<script src="/frontend/');
}

const updatedFileContentArray = bladeFileContents.split(/\r?\n/).map(line => {
    switch (true) {
        case line.includes('<script src="'):
            return updateLine(line, 'styles');
        default:
            return line;
    }
});


const updatedFileContents = updatedFileContentArray.join('\n');

// write the new names to the php file
fs.writeFileSync(`${bladeFilePath}`, updatedFileContents);
