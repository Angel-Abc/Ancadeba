import { z } from 'zod'

// IDs are also single filename segments when resolving resource references.
export const gameIdSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/)
