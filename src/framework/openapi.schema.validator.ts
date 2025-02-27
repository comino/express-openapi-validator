import * as Ajv from 'ajv';
import * as merge from 'lodash.merge';
import * as draftSchema from 'ajv/lib/refs/json-schema-draft-04.json';
// https://github.com/OAI/OpenAPI-Specification/blob/master/schemas/v3.0/schema.json
import * as openapi3Schema from './openapi.v3.schema.json';

export class OpenAPISchemaValidator {
  private validator: Ajv.ValidateFunction;
  constructor({ version, extensions }) {
    const v = new Ajv({ schemaId: 'auto', allErrors: true });
    v.addMetaSchema(draftSchema);

    const ver = version && parseInt(String(version), 10);
    if (!ver) throw Error('version missing from OpenAPI specification');
    if (ver != 3) throw Error('OpenAPI v3 specification version is required');

    const schema = merge({}, openapi3Schema, extensions || {});
    v.addSchema(schema);
    this.validator = v.compile(schema);
  }

  public validate(openapiDoc) {
    const valid = this.validator(openapiDoc);
    if (!valid) {
      return { errors: this.validator.errors };
    } else {
      return { errors: [] };
    }
  }
}
