import { z } from 'zod'

/** Repository operations are explicit; having a method does not imply backend support. */
export const repositoryCapabilitiesSchema = z.object({
  history: z.boolean(),
  assetImport: z.boolean(),
  projectCreation: z.boolean(),
  projectDuplication: z.boolean(),
  projectImport: z.boolean(),
  projectExport: z.boolean(),
  projectRenaming: z.boolean(),
  projectFolderRenaming: z.boolean(),
  projectDeletion: z.boolean(),
  projectRestoration: z.boolean(),
  projectRepair: z.boolean(),
})

export type RepositoryCapabilities = Readonly<z.infer<typeof repositoryCapabilitiesSchema>>

export const editorFeaturesSchema = repositoryCapabilitiesSchema.partial().extend({
  history: z.boolean().default(false),
  assetImport: z.boolean().default(false),
  projectDiscovery: z.boolean().optional(),
  gameExport: z.boolean().optional(),
})

export type EditorFeatures = z.infer<typeof editorFeaturesSchema>
