// Shared terminal-prompt helpers for the scripts/add-*.js CLI tools.
const readline = require('readline');

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// Prompts on stdin while masking each typed character with "*". Requires
// stdin to be a TTY for raw-mode input; falls back to plain (visible) input
// otherwise (e.g. when piped), so the script still works non-interactively.
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);

    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question('', (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }

    let value = '';
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();

    const onData = (char) => {
      char = char.toString('utf8');
      if (char === '\n' || char === '\r' || char === '') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(value);
      } else if (char === '') { // Ctrl-C
        process.stdout.write('\n');
        process.exit(130);
      } else if (char === '' || char === '\b') { // backspace
        if (value.length) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        value += char;
        process.stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

module.exports = { ask, askHidden };
