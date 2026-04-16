import type { Payload } from 'payload'

export type CompanyBankDisplay = {
  bankCode: string
  bankAccount: string
  accountName: string
}

function idOfRelation(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value && (value as { id?: unknown }).id != null) {
    return String((value as { id: string }).id)
  }
  return null
}

/** 依訂單 `company` 或建立者 `user.company` 解析禮儀公司 id */
export async function resolveOrderCompanyId(
  payload: Payload,
  order: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  if (!order) return null

  let companyId = idOfRelation(order.company)

  if (!companyId) {
    const creatorId = idOfRelation(order.createdBy)
    if (creatorId) {
      const creator = await payload.findByID({
        collection: 'users',
        id: creatorId,
        depth: 0,
        overrideAccess: true,
      })
      companyId = idOfRelation((creator as { company?: unknown } | null)?.company)
    }
  }

  return companyId
}

/**
 * 依訂單的 `company` 或建立者使用者的 `company` 取得禮儀公司匯款欄位（後台／前台皆可用 overrideAccess 呼叫）。
 */
export async function getCompanyRemittanceDisplay(
  payload: Payload,
  order: Record<string, unknown> | null | undefined,
): Promise<CompanyBankDisplay> {
  const fallback: CompanyBankDisplay = {
    bankCode: '—',
    bankAccount: '—',
    accountName: '—',
  }

  const companyId = await resolveOrderCompanyId(payload, order)
  if (!companyId) return fallback

  const company = await payload.findByID({
    collection: 'companies',
    id: companyId,
    depth: 0,
    overrideAccess: true,
  })

  const r = (company as { remittance?: Record<string, unknown> } | null)?.remittance
  if (!r || typeof r !== 'object') return fallback

  const bankCode = typeof r.bankCode === 'string' && r.bankCode.trim() ? r.bankCode.trim() : '—'
  const bankAccount =
    typeof r.bankAccount === 'string' && r.bankAccount.trim() ? r.bankAccount.trim() : '—'
  const accountName =
    typeof r.accountName === 'string' && r.accountName.trim() ? r.accountName.trim() : '—'

  return { bankCode, bankAccount, accountName }
}

/** 禮儀公司顯示名稱（用於前台訂單頁等） */
export async function getOrderCompanyName(
  payload: Payload,
  order: Record<string, unknown> | null | undefined,
): Promise<string> {
  const companyId = await resolveOrderCompanyId(payload, order)
  if (!companyId) return '—'

  const company = await payload.findByID({
    collection: 'companies',
    id: companyId,
    depth: 0,
    overrideAccess: true,
  })

  const n = (company as { name?: string } | null)?.name
  return typeof n === 'string' && n.trim() ? n.trim() : '—'
}
