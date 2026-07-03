import Ajv2020 from "ajv/dist/2020";
import type { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import fs from "fs";
import path from "path";
import { PROTOCOL_SCHEMAS } from "@/lib/validation/schema-registry";

const PROTOCOL_DIR = path.join(process.cwd(), "protocol", "schemas");

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validatorCache = new Map<string, ValidateFunction>();

function loadSchemaObject(schemaId: string): object {
  const bundled = PROTOCOL_SCHEMAS[schemaId];
  if (bundled) return bundled;

  const filePath = path.join(PROTOCOL_DIR, `${schemaId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Schema not found: ${schemaId}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getSchemaValidator(schemaId: string): ValidateFunction {
  const cached = validatorCache.get(schemaId);
  if (cached) return cached;

  const schema = loadSchemaObject(schemaId);
  const validate = ajv.compile(schema);
  validatorCache.set(schemaId, validate);
  return validate;
}

export function validateAgainstSchema(
  schemaId: string,
  data: unknown
): { valid: true } | { valid: false; errors: string[] } {
  try {
    const validate = getSchemaValidator(schemaId);
    const valid = validate(data);
    if (valid) return { valid: true };
    const errors = (validate.errors ?? []).map(
      (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`
    );
    return { valid: false, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [
        error instanceof Error ? error.message : "Schema validation failed",
      ],
    };
  }
}

export function validateJsonSchema(
  schema: object,
  data: unknown
): { valid: true } | { valid: false; errors: string[] } {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (valid) return { valid: true };
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`
  );
  return { valid: false, errors };
}
