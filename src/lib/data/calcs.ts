import { isBlob } from "../env";

export type Calc = { meta: { name: string; slug: string }; template?: string; config?: any };

// sve funkcije imaju isti potpis u oba backenda
let impl: any;
if (isBlob()) {
  impl = require("../blobStore");
} else {
  impl = require("../calcsStore");
}

export const list             = impl.list       as (uid: string) => Promise<Calc[]>;
export const get              = impl.get        as (uid: string, slug: string) => Promise<Calc | undefined>;
export const create           = impl.create     as (uid: string, name?: string) => Promise<Calc>;
export const createFromTemplate = impl.createFromTemplate as (uid: string, tpl: string, name?: string) => Promise<Calc>;
export const duplicate        = impl.duplicate  as (uid: string, fromSlug: string, newName: string) => Promise<string | undefined>;
export const remove           = impl.remove     as (uid: string, slug: string) => Promise<boolean>;
export const updateName       = impl.updateName as (uid: string, slug: string, name: string) => Promise<boolean>;
// NEW:
export const createWithSlug   = impl.createWithSlug as (
  uid: string,
  slug: string,
  name: string,
  cfg?: any,
  template?: string
) => Promise<Calc>;