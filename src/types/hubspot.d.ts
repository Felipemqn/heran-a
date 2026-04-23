// Shim de tipos para @hubspot/api-client.
// Motivo: package.json declara types mas nao publica o .d.ts.
// Substituir quando o upstream corrigir.

declare module '@hubspot/api-client' {
  export interface ContactProperties {
    firstname?: string
    lastname?: string
    email?: string
    company?: string
    [key: string]: unknown
  }

  export interface ContactResult {
    id: string
    properties: ContactProperties
  }

  export interface SearchFilter {
    propertyName: string
    operator: string
    value: string
  }

  export interface SearchFilterGroup {
    filters: SearchFilter[]
  }

  export interface SearchRequest {
    filterGroups: SearchFilterGroup[]
    properties?: string[]
    limit?: number
    sorts?: unknown[]
    after?: string | undefined
  }

  export interface SearchResponse<T> {
    total: number
    results: T[]
    paging?: { next?: { after: string } }
  }

  export interface ContactsSearchApi {
    doSearch(req: SearchRequest): Promise<SearchResponse<ContactResult>>
  }

  export interface ContactsClient {
    searchApi: ContactsSearchApi
  }

  export interface CrmClient {
    contacts: ContactsClient
  }

  export interface ClientOptions {
    accessToken: string
  }

  export class Client {
    constructor(options: ClientOptions)
    crm: CrmClient
  }
}
