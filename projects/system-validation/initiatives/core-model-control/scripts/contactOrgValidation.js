'use strict';

const { execSync } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../../../../..');
const INPUT_PATH = path.join(PROJECT_ROOT, 'contact_spec.json');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'contact_org_validation.json');

const requestExecutor = require(path.join(PROJECT_ROOT, 'services/requestExecutor'));

const SF_ORG = process.env.SF_ORG || 'sina-fsc';

function fetchOrgFields(objectName) {
  const cmd = `sf sobject describe --sobject ${objectName} --json --target-org ${SF_ORG}`;
  const stdout = execSync(cmd, { encoding: 'utf8' });
  const parsed = JSON.parse(stdout);
  const describe = parsed.result || parsed;
  return describe.fields.map(f => f.name);
}

function parseValidationResult(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function isValidResult(r) {
  return (
    r !== null &&
    typeof r === 'object' &&
    typeof r.objectExists === 'boolean' &&
    Array.isArray(r.missingFields) &&
    Array.isArray(r.validFields)
  );
}

async function run() {
  console.log(`Using Salesforce org: ${SF_ORG}`);

  const spec = JSON.parse(await fs.readFile(INPUT_PATH, 'utf8'));

  let realFields;
  try {
    realFields = fetchOrgFields(spec.object);
  } catch (err) {
    console.error(`Failed to describe ${spec.object} from org ${SF_ORG}: ${err.message}`);
    process.exit(1);
  }

  const prompt = [
    'You are a Salesforce schema validator.',
    'Compare the required fields from the spec against the real schema fields fetched from the org.',
    '',
    `Spec object: ${spec.object}`,
    `Required fields: ${JSON.stringify(spec.fields)}`,
    `Real schema fields: ${JSON.stringify(realFields)}`,
    '',
    'Return ONLY valid JSON in this exact shape, with no explanation or extra text:',
    '{',
    '  "objectExists": boolean,',
    '  "missingFields": string[],',
    '  "validFields": string[]',
    '}',
    '',
    '- objectExists: true (the object was successfully described)',
    '- missingFields: required fields not found in the real schema',
    '- validFields: required fields that exist in the real schema',
  ].join('\n');

  let result;
  try {
    const llmResponse = await requestExecutor.execute({
      capability: 'summarize_cheap',
      agent: 'validator',
      project: 'system-validation',
      payload: { prompt },
      estimatedTokens: 500,
    });

    if (llmResponse.status !== 'ok') {
      throw new Error(`LLM request ${llmResponse.status}: ${llmResponse.reason || 'unknown'}`);
    }

    result = parseValidationResult(llmResponse.response.text);
    if (!isValidResult(result)) {
      throw new Error('Malformed LLM output — falling back to deterministic result');
    }
  } catch (err) {
    console.error(`LLM validation warning: ${err.message}`);
    result = {
      objectExists: realFields.length > 0,
      missingFields: spec.fields.filter(f => !realFields.includes(f)),
      validFields: spec.fields.filter(f => realFields.includes(f)),
    };
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log('org validation completed');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
