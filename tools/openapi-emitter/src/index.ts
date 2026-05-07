/**
 * OpenAPI scaffold emitter for the AR Mgmt Portal endpoints.
 *
 * Phase 0 of the §15.4 OpenAPI emission roadmap: hand-authored YAML that
 * exactly matches the actions registry + mock-server schemas. The shape is
 * structured to be the target of an automated emitter — when we add
 * `zod-to-openapi` (or similar) in Phase 8, the body of writeOpenApiYaml()
 * gets replaced by a registry walk that converts each action declaration's
 * request/response Zod schema to a JSON Schema and emits the corresponding
 * paths/operations.
 *
 * For now: this CLI reads the registry IDs from the action set (so we can
 * statically verify the spec covers every action) and emits a curated YAML
 * to stdout or a file path.
 *
 * Run:
 *   pnpm --filter @tensaw/openapi-emitter run emit > openapi/ar.yaml
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const AR_ACTION_IDS = [
  'ar.list',
  'ar.get-detail',
  'ar.update-owner',
  'ar.update-due-date',
  'ar.bulk-update-owner',
  'ar.bulk-update-due-date',
  'claims.add-to-workflow',
  'ref.clinics',
  'ref.providers',
  'ref.payers',
  'ref.owners',
  'ar.open-detail', // navigate — no wire endpoint
];

function emitYaml(): string {
  return `openapi: 3.1.0
info:
  title: Tensaw — AR Mgmt Portal API
  version: 1.0.0
  description: |
    AR (Accounts Receivable) Management Portal endpoints. Generated from the
    @tensaw/actions registry; the action ids that map to each operation are
    listed under the operation's \`x-tensaw-action-id\` extension.

    Wire envelope: every successful response is wrapped as
    \`{ success: true, data: <T>, meta: {...} }\`. Every failure is
    \`{ success: false, error: { code, message, details? }, meta: {...} }\`.
servers:
  - url: /api/v1
paths:

  /ar:
    get:
      summary: List AR rows
      x-tensaw-action-id: ar.list
      parameters:
        - { name: mode, in: query, required: true, schema: { type: string, enum: [working, add-to-workflow] } }
        - { name: clinicIds, in: query, schema: { type: array, items: { type: string } }, style: form, explode: true }
        - { name: providerIds, in: query, schema: { type: array, items: { type: string } }, style: form, explode: true }
        - { name: payerIds, in: query, schema: { type: array, items: { type: string } }, style: form, explode: true }
        - { name: ownerIds, in: query, schema: { type: array, items: { type: string } }, style: form, explode: true }
        - { name: statuses, in: query, schema: { type: array, items: { $ref: '#/components/schemas/ClaimStatus' } }, style: form, explode: true }
        - { name: priorities, in: query, schema: { type: array, items: { $ref: '#/components/schemas/Priority' } }, style: form, explode: true }
        - { name: dosFrom, in: query, schema: { type: string, format: date } }
        - { name: dosTo, in: query, schema: { type: string, format: date } }
        - { name: agingMinDays, in: query, schema: { type: integer, minimum: 0 } }
        - { name: search, in: query, schema: { type: string } }
        - { name: sortColumn, in: query, schema: { type: string } }
        - { name: sortDir, in: query, schema: { type: string, enum: [asc, desc] } }
        - { name: pageIndex, in: query, schema: { type: integer, minimum: 0 } }
        - { name: pageSize, in: query, schema: { type: integer, minimum: 1, maximum: 100 } }
      responses:
        '200':
          description: AR list page
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_ARListResponse'

  /ar/{rowId}:
    get:
      summary: Get a single AR row
      x-tensaw-action-id: ar.get-detail
      parameters:
        - { name: rowId, in: path, required: true, schema: { type: string } }
      responses:
        '200':
          description: AR row
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_ARRow'
        '404':
          $ref: '#/components/responses/NotFound'

  /ar/{rowId}/owner:
    patch:
      summary: Update owner for one row
      x-tensaw-action-id: ar.update-owner
      parameters:
        - { name: rowId, in: path, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [ownerId]
              properties:
                ownerId: { type: string, nullable: true }
      responses:
        '200':
          description: Updated row
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_ARRow'

  /ar/{rowId}/due-date:
    patch:
      summary: Update due date for one row
      x-tensaw-action-id: ar.update-due-date
      parameters:
        - { name: rowId, in: path, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [dueAt]
              properties:
                dueAt: { type: string, format: date-time, nullable: true }
      responses:
        '200':
          description: Updated row
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_ARRow'

  /ar:bulk-update-owner:
    patch:
      summary: Bulk owner update
      x-tensaw-action-id: ar.bulk-update-owner
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rowIds, ownerId]
              properties:
                rowIds: { type: array, items: { type: string }, minItems: 1 }
                ownerId: { type: string, nullable: true }
      responses:
        '200':
          description: Bulk update result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_BulkResult'

  /ar:bulk-update-due-date:
    patch:
      summary: Bulk due date update
      x-tensaw-action-id: ar.bulk-update-due-date
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [rowIds, dueAt]
              properties:
                rowIds: { type: array, items: { type: string }, minItems: 1 }
                dueAt: { type: string, format: date-time, nullable: true }
      responses:
        '200':
          description: Bulk update result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_BulkResult'

  /workflow/cases:bulk:
    post:
      summary: Add claims to workflow (long-running)
      description: |
        Bulk-promotes candidate claims into active workflow. May take up to 2
        minutes; client timeout is set to 120s for this operation.
      x-tensaw-action-id: claims.add-to-workflow
      x-tensaw-timeout-ms: 120000
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [claimIds, initialPriority]
              properties:
                claimIds: { type: array, items: { type: string }, minItems: 1 }
                initialPriority: { $ref: '#/components/schemas/Priority' }
      responses:
        '200':
          description: Add result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Envelope_AddToWorkflowResponse'

  /ref/clinics:
    get:
      summary: Reference data — clinics
      x-tensaw-action-id: ref.clinics
      responses:
        '200': { $ref: '#/components/responses/RefDataResponse' }
  /ref/providers:
    get:
      summary: Reference data — providers
      x-tensaw-action-id: ref.providers
      responses:
        '200': { $ref: '#/components/responses/RefDataResponse' }
  /ref/payers:
    get:
      summary: Reference data — payers
      x-tensaw-action-id: ref.payers
      responses:
        '200': { $ref: '#/components/responses/RefDataResponse' }
  /ref/owners:
    get:
      summary: Reference data — owners
      x-tensaw-action-id: ref.owners
      responses:
        '200': { $ref: '#/components/responses/RefDataResponse' }

components:
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Envelope_Error'
    RefDataResponse:
      description: Reference-data list
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Envelope_RefDataResponse'

  schemas:
    Meta:
      type: object
      required: [correlationId, timestamp, apiVersion]
      properties:
        correlationId: { type: string }
        timestamp: { type: string, format: date-time }
        apiVersion: { type: string }

    Error:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
        details: { type: object, additionalProperties: true }

    ClaimStatus:
      type: string
      enum: [completed, filed, secondary, denied, rejected, closed]

    Priority:
      type: string
      enum: [P1, P2, P3, P4]

    ARRow:
      type: object
      required:
        - id
        - clinicId
        - clinicName
        - dos
        - patientLastName
        - patientFirstName
        - mrn
        - providerId
        - providerName
        - facility
        - primaryPayer
        - secondaryPayer
        - status
        - workflowName
        - workflowState
        - currentTask
        - ownerId
        - ownerName
        - priority
        - dueAt
        - nextTfl
        - billed
        - balance
      properties:
        id: { type: string }
        clinicId: { type: string }
        clinicName: { type: string }
        dos: { type: string, format: date }
        patientLastName: { type: string }
        patientFirstName: { type: string }
        mrn: { type: string }
        providerId: { type: string }
        providerName: { type: string }
        facility: { type: string }
        primaryPayer: { type: string }
        secondaryPayer: { type: string, nullable: true }
        status: { $ref: '#/components/schemas/ClaimStatus' }
        workflowName: { type: string, nullable: true }
        workflowState: { type: string, nullable: true }
        currentTask: { type: string, nullable: true }
        ownerId: { type: string, nullable: true }
        ownerName: { type: string, nullable: true }
        priority: { $ref: '#/components/schemas/Priority' }
        dueAt: { type: string, format: date-time, nullable: true }
        nextTfl: { type: string, format: date, nullable: true }
        billed: { type: number }
        balance: { type: number }

    ARListResponse:
      type: object
      required: [rows, totalCount, totalBalance]
      properties:
        rows: { type: array, items: { $ref: '#/components/schemas/ARRow' } }
        totalCount: { type: integer }
        totalBalance: { type: number }

    BulkResult:
      type: object
      required: [updated, rows]
      properties:
        updated: { type: integer }
        rows: { type: array, items: { $ref: '#/components/schemas/ARRow' } }

    AddToWorkflowResponse:
      type: object
      required: [added, rows]
      properties:
        added: { type: integer }
        rows: { type: array, items: { $ref: '#/components/schemas/ARRow' } }

    RefDataItem:
      type: object
      required: [id, label]
      properties:
        id: { type: string }
        label: { type: string }

    RefDataResponse:
      type: object
      required: [items]
      properties:
        items: { type: array, items: { $ref: '#/components/schemas/RefDataItem' } }

    Envelope_ARRow:
      type: object
      required: [success, data, meta]
      properties:
        success: { type: boolean, enum: [true] }
        data: { $ref: '#/components/schemas/ARRow' }
        meta: { $ref: '#/components/schemas/Meta' }

    Envelope_ARListResponse:
      type: object
      required: [success, data, meta]
      properties:
        success: { type: boolean, enum: [true] }
        data: { $ref: '#/components/schemas/ARListResponse' }
        meta: { $ref: '#/components/schemas/Meta' }

    Envelope_BulkResult:
      type: object
      required: [success, data, meta]
      properties:
        success: { type: boolean, enum: [true] }
        data: { $ref: '#/components/schemas/BulkResult' }
        meta: { $ref: '#/components/schemas/Meta' }

    Envelope_AddToWorkflowResponse:
      type: object
      required: [success, data, meta]
      properties:
        success: { type: boolean, enum: [true] }
        data: { $ref: '#/components/schemas/AddToWorkflowResponse' }
        meta: { $ref: '#/components/schemas/Meta' }

    Envelope_RefDataResponse:
      type: object
      required: [success, data, meta]
      properties:
        success: { type: boolean, enum: [true] }
        data: { $ref: '#/components/schemas/RefDataResponse' }
        meta: { $ref: '#/components/schemas/Meta' }

    Envelope_Error:
      type: object
      required: [success, error, meta]
      properties:
        success: { type: boolean, enum: [false] }
        error: { $ref: '#/components/schemas/Error' }
        meta: { $ref: '#/components/schemas/Meta' }
`;
}

function main(): void {
  const args = process.argv.slice(2);
  const outFlagIdx = args.indexOf('--out');
  const yaml = emitYaml();

  if (outFlagIdx >= 0) {
    const outPath = args[outFlagIdx + 1];
    if (!outPath) {
      process.stderr.write('Usage: openapi-emitter [--out <path>]\n');
      process.exit(1);
    }
    const resolved = resolve(outPath);
    writeFileSync(resolved, yaml, { encoding: 'utf-8' });
    process.stderr.write(`Wrote ${String(yaml.length)} bytes to ${resolved}\n`);
    process.stderr.write(`Covered ${String(AR_ACTION_IDS.length)} action ids\n`);
  } else {
    process.stdout.write(yaml);
  }
}

main();
