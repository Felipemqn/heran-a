import { Client } from '@hubspot/api-client'
import { db } from '@/lib/db'

export const HORIZONTE_BETA_TAG = 'Horizonte: Beta'

function client() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN nao configurado')
  return new Client({ accessToken: token })
}

export interface HubspotClientContact {
  hubspotId: string
  firstName: string | null
  lastName: string | null
  email: string | null
  company: string | null
  tags: string[]
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// Lista contatos tagueados com "Horizonte: Beta".
// HubSpot usa "hs_content_membership_notes" ou custom property para tags.
// Aqui assumimos uma propriedade customizada `horizonte_program` = 'beta'.
export async function listFamilyClients(): Promise<HubspotClientContact[]> {
  const hs = client()
  const result = await hs.crm.contacts.searchApi.doSearch({
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'horizonte_program',
            operator: 'EQ' as const,
            value: 'beta',
          },
        ],
      },
    ],
    properties: ['firstname', 'lastname', 'email', 'company', 'horizonte_program'],
    limit: 100,
    sorts: [],
    after: undefined as unknown as string,
  })

  return result.results.map((c) => ({
    hubspotId: c.id,
    firstName: (c.properties.firstname as string | undefined) ?? null,
    lastName: (c.properties.lastname as string | undefined) ?? null,
    email: (c.properties.email as string | undefined) ?? null,
    company: (c.properties.company as string | undefined) ?? null,
    tags: [HORIZONTE_BETA_TAG],
  }))
}

export interface SyncResult {
  familyId: string
  created: boolean
  updated: boolean
  name: string
}

export async function syncClientToFamily(
  contact: HubspotClientContact,
  actorClerkUserId: string | null
): Promise<SyncResult> {
  const familyName =
    contact.company ??
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ??
    contact.email ??
    'Familia sem nome'

  const slug = `hs-${contact.hubspotId}`

  const existing = await db.family.findUnique({ where: { slug } })

  if (existing) {
    if (existing.name !== familyName) {
      await db.family.update({
        where: { id: existing.id },
        data: { name: familyName },
      })
      await db.auditLog.create({
        data: {
          familyId: existing.id,
          actorId: actorClerkUserId,
          action: 'hubspot.sync',
          entityType: 'family',
          entityId: existing.id,
          metadata: { hubspotId: contact.hubspotId, change: 'renamed' },
        },
      })
      return { familyId: existing.id, created: false, updated: true, name: familyName }
    }
    return { familyId: existing.id, created: false, updated: false, name: existing.name }
  }

  const created = await db.family.create({
    data: { name: familyName, slug },
  })

  // Founder member derivado do contato HubSpot (se houver nome ou email).
  const founderName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
  if (founderName || contact.email) {
    await db.member.create({
      data: {
        familyId: created.id,
        name: founderName || contact.email || 'Fundador',
        email: contact.email,
        role: 'founder',
        generation: 'founder',
      },
    })
  }

  await db.auditLog.create({
    data: {
      familyId: created.id,
      actorId: actorClerkUserId,
      action: 'hubspot.sync',
      entityType: 'family',
      entityId: created.id,
      metadata: { hubspotId: contact.hubspotId, change: 'created' },
    },
  })

  return { familyId: created.id, created: true, updated: false, name: familyName }
}

// Slugify exposto para testes unitarios.
export const __internals = { slugify }
