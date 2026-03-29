const fs = require('fs/promises');

const OUTPUT_PATH = './salesforce_spec.json';

async function run() {
    const input = 'Build a Lightning Web Component for Account with fields Name, Phone, Industry';
    const objectMatch = input.match(/\b(Build a Lightning Web Component for)\s+(\w+)\b/);
    const fieldsMatch = input.match(/fields\s+(.*)/);

    const object = objectMatch ? objectMatch[2] : null;
    const fields = fieldsMatch ? fieldsMatch[1].split(',').map(field => field.trim()) : [];

    // Validate
    if (!object || object.length === 0) throw new Error('VALIDATE failed: object must exist');
    if (fields.length < 2) throw new Error('VALIDATE failed: at least 2 fields are required');

    // Store
    const spec = { object, fields };
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(spec, null, 2));
    console.log('ACTION: spec ready for org mapping');
}

run().catch(err => console.error('Error:', err.message));