import type { UID, Data, Modules } from '@strapi/strapi';

//
// Shared types for the server part.
//
// - See also: https://docs.strapi.io/cms/typescript/documents-and-entries#type-imports
//

export type ContentTypeUID = UID.ContentType;

export type DocumentID = Data.DocumentID;
export type DocumentIDList = DocumentID[];

export type AnyDocument = Modules.Documents.AnyDocument;

export type Filters = any;
export type Locale = string;
