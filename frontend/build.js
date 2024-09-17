const fs = require('fs');
const path = require('path');
const bladeFileName = 'diceway.blade.php';
const bladeFilePath = path.join(__dirname, '..', 'resources', 'views', bladeFileName);

// Read the contents of the Blade file
const bladeFileContents = fs.readFileSync(bladeFilePath, 'utf8');

// Update function using regular expressions
const updateContents = (contents) => {
  return contents
    .replace(/<script\s+src="/g, '<script src="/frontend/')
    .replace(/href="styles-/g, 'href="/frontend/styles-')
    .replace(/rel="modulepreload"\s+href="/g, 'rel="modulepreload" href="/frontend/');
};

// Update the file contents
const updatedFileContents = updateContents(bladeFileContents);

// Write the updated contents back to the Blade file
fs.writeFileSync(bladeFilePath, updatedFileContents);

console.log('Blade file updated successfully.');
