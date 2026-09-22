const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = 'conversacion-completa.txt';

const lines = fs.readFileSync(inputFile, 'utf-8').split('\n').filter(Boolean);
let output = '';

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    const msg = entry.message;
    if (!msg || !msg.content) continue;

    const role = msg.role === 'user' ? '=== TÚ ===' : '=== CLAUDE ===';
    let text = '';

    if (typeof msg.content === 'string') {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text') text += block.text + '\n';
        if (block.type === 'tool_use') text += `[Acción: ${block.name}]\n`;
      }
    }

    if (text.trim()) {
      output += `\n${role}\n${text.trim()}\n`;
    }
  } catch (e) {}
}

fs.writeFileSync(outputFile, output, 'utf-8');
console.log(`Listo. Revisa: ${path.resolve(outputFile)}`);