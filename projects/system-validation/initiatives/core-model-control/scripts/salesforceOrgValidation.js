const { exec } = require('child_process');
const fs = require('fs/promises');

const INPUT_PATH = './salesforce_spec.json';
const OUTPUT_PATH = './salesforce_org_validation.json';

async function run() {
    const specRaw = await fs.readFile(INPUT_PATH, 'utf8');
    const spec = JSON.parse(specRaw);

    const cmd = `sfdx force:schema:sobject:describe -s ${spec.object} -u sina-devhub`;

    exec(cmd, async (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing command:', error.message);
            return;
        }
        if (stderr) {
            console.error('Command error output:', stderr);
            return;
        }

        const result = JSON.parse(stdout);
        const missingFields = spec.fields.filter(field => !result.fields.map(f => f.name).includes(field));

        const comparisonResult = {
            objectExists: result && result.fields.length > 0,
            missingFields
        };

        await fs.writeFile(OUTPUT_PATH, JSON.stringify(comparisonResult, null, 2));
        console.log('ACTION: org validation completed');
    });
}

run().catch(err => console.error('Error:', err.message));