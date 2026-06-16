import { z } from 'zod';

// ---------------------------------------------------------------------------
// Component shape (catalog-agnostic). Catalog-specific validation is the
// catalog's job; the envelope only requires id + component type and passes
// all other properties through (renderer_guide.md §Protocol Models).
// ---------------------------------------------------------------------------
export const componentSchema = z
  .object({
    id: z.string().min(1),
    component: z.string().min(1),
  })
  .passthrough();

export const componentsListSchema = z.array(componentSchema);

// ---------------------------------------------------------------------------
// Server -> client messages (specification/v1_0/json/server_to_client.json).
// Each envelope is strict at the top level: exactly `version` plus the one
// message key. The union therefore enforces "exactly one envelope key".
// ---------------------------------------------------------------------------
const version = z.literal('v1.0');

export const createSurfaceSchema = z
  .object({
    version,
    createSurface: z.object({
      surfaceId: z.string().min(1),
      catalogId: z.string().min(1),
      surfaceProperties: z.record(z.string(), z.unknown()).optional(),
      sendDataModel: z.boolean().optional(),
      components: componentsListSchema.optional(),
      dataModel: z.unknown().optional(),
    }),
  })
  .strict();

export const updateComponentsSchema = z
  .object({
    version,
    updateComponents: z.object({
      surfaceId: z.string().min(1),
      components: componentsListSchema.min(1),
    }),
  })
  .strict();

export const updateDataModelSchema = z
  .object({
    version,
    updateDataModel: z.object({
      surfaceId: z.string().min(1),
      path: z.string().optional(),
      value: z.unknown().optional(),
    }),
  })
  .strict();

export const deleteSurfaceSchema = z
  .object({
    version,
    deleteSurface: z.object({
      surfaceId: z.string().min(1),
    }),
  })
  .strict();

export const callFunctionSchema = z
  .object({
    version,
    functionCallId: z.string().min(1),
    wantResponse: z.boolean().optional(),
    callFunction: z.object({
      call: z.string().min(1),
      args: z.record(z.string(), z.unknown()).optional(),
    }),
  })
  .strict();

export const actionResponseSchema = z
  .object({
    version,
    actionId: z.string().min(1),
    actionResponse: z
      .object({
        value: z.unknown().optional(),
        error: z.object({ code: z.string(), message: z.string() }).optional(),
      })
      .refine((r) => (r.value !== undefined) !== (r.error !== undefined), {
        message: 'Exactly one of value or error must be present',
      }),
  })
  .strict();

export const a2uiMessageSchema = z.union([
  createSurfaceSchema,
  updateComponentsSchema,
  updateDataModelSchema,
  deleteSurfaceSchema,
  callFunctionSchema,
  actionResponseSchema,
]);

export type A2uiMessage = z.infer<typeof a2uiMessageSchema>;
export type CreateSurfaceMessage = z.infer<typeof createSurfaceSchema>;
export type UpdateComponentsMessage = z.infer<typeof updateComponentsSchema>;
export type UpdateDataModelMessage = z.infer<typeof updateDataModelSchema>;
export type DeleteSurfaceMessage = z.infer<typeof deleteSurfaceSchema>;
export type CallFunctionMessage = z.infer<typeof callFunctionSchema>;
export type ActionResponseMessage = z.infer<typeof actionResponseSchema>;

// ---------------------------------------------------------------------------
// Client -> server events (specification/v1_0/json/client_to_server.json).
// ---------------------------------------------------------------------------
export const clientActionSchema = z.object({
  version,
  action: z.object({
    name: z.string().min(1),
    surfaceId: z.string().min(1),
    sourceComponentId: z.string().min(1),
    timestamp: z.string().min(1),
    context: z.record(z.string(), z.unknown()),
    wantResponse: z.boolean().optional(),
    actionId: z.string().optional(),
    responsePath: z.string().optional(),
  }),
});

export const functionResponseSchema = z.object({
  version,
  functionResponse: z.object({
    functionCallId: z.string().min(1),
    call: z.string().min(1),
    value: z.unknown(),
  }),
});

export const clientErrorSchema = z.object({
  version,
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    surfaceId: z.string().optional(),
    functionCallId: z.string().optional(),
  }),
});

export type ClientAction = z.infer<typeof clientActionSchema>;
export type FunctionResponse = z.infer<typeof functionResponseSchema>;
export type ClientError = z.infer<typeof clientErrorSchema>;
export type ClientEvent = ClientAction | FunctionResponse | ClientError;

// ---------------------------------------------------------------------------
// Validation error (specification/v1_0/docs/a2ui_protocol.md §standard-
// validation-error-format: code VALIDATION_FAILED + surfaceId + path + msg).
// ---------------------------------------------------------------------------
export interface ValidationIssue {
  readonly code: 'VALIDATION_FAILED';
  readonly surfaceId: string;
  readonly path: string;
  readonly message: string;
}

export class A2uiValidationError extends Error {
  readonly code = 'VALIDATION_FAILED' as const;
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(
      `A2UI validation failed: ${issues.map((i) => `[${i.path}] ${i.message}`).join('; ')}`,
    );
    this.name = 'A2uiValidationError';
    this.issues = issues;
  }
}

function extractSurfaceId(json: unknown): string {
  if (typeof json === 'object' && json !== null) {
    const obj = json as Record<string, unknown>;
    for (const key of [
      'createSurface',
      'updateComponents',
      'updateDataModel',
      'deleteSurface',
      'callFunction',
      'actionResponse',
    ]) {
      const body = obj[key];
      if (body && typeof body === 'object') {
        const sid = (body as Record<string, unknown>).surfaceId;
        if (typeof sid === 'string') return sid;
      }
    }
  }
  return '';
}

/** Parse and validate a server->client message (accepts object or JSON string). */
export function parseA2uiMessage(input: unknown): A2uiMessage {
  let json = input;
  if (typeof input === 'string') {
    try {
      json = JSON.parse(input);
    } catch (e) {
      throw new A2uiValidationError([
        {
          code: 'VALIDATION_FAILED',
          surfaceId: '',
          path: '/',
          message: `Invalid JSON: ${(e as Error).message}`,
        },
      ]);
    }
  }
  const result = a2uiMessageSchema.safeParse(json);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((iss) => ({
      code: 'VALIDATION_FAILED',
      surfaceId: extractSurfaceId(json),
      path: '/' + iss.path.join('/'),
      message: iss.message,
    }));
    throw new A2uiValidationError(issues);
  }
  return result.data;
}

/** Serialize a client->server event to a JSON string for the transport. */
export function serializeClientEvent(event: ClientEvent): string {
  return JSON.stringify(event);
}
