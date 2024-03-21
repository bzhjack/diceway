const fs = require('fs');
const bladeFileName = 'diceway.blade.php';
const bladeFilePath = `../resources/views/${bladeFileName}`;

const bladeFileContents = fs.readFileSync(`${bladeFilePath}`, 'utf8');


const updateLine = (line, name) => {
    if (name === 'script') {
        return line.replaceAll('<script src="', '<script src="/frontend/');
    } else {
        return line.replaceAll('href="styles-', 'href="/frontend/styles-');
    }
}

const updatedFileContentArray = bladeFileContents.split(/\r?\n/).map(line => {
    switch (true) {
        case line.includes('<script src="'):
            return updateLine(line, 'script');
        case line.includes('href="styles-'):
            return updateLine(line, 'style');
        default:
            return line;
    }
});


const updatedFileContents = updatedFileContentArray.join('\n');

// write the new names to the php file
fs.writeFileSync(`${bladeFilePath}`, updatedFileContents);
