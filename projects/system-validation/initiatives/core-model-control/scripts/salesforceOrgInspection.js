const fs = require('fs/promises');
const { exec } = require('child_process');

const OUTPUT_PATH = './account_describe.json';

async function run() {
    const command = 'sf sobject describe --sobject Account --json --target-org sina-fsc';
    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing command:', error.message);
            return;
        }
        if (stderr) {
            console.error('Command error output:', stderr);
            return;
        }

        // Save raw output
        await fs.writeFile(OUTPUT_PATH, stdout, 'utf8');
        console.log('ACTION: org inspection completed');
    });
}

run().catch(err => console.error('Error:', err.message));