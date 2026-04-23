function ptNumber(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', ',')
}

export function fmtMoney(valueBrl: number, opts: { compact?: boolean } = {}): string {
  const { compact = false } = opts
  if (compact) {
    const abs = Math.abs(valueBrl)
    if (abs >= 1_000_000_000) return `R$ ${ptNumber(valueBrl / 1_000_000_000, 1)}B`
    if (abs >= 1_000_000) return `R$ ${ptNumber(valueBrl / 1_000_000, 1)}M`
    if (abs >= 1_000) return `R$ ${ptNumber(valueBrl / 1_000, 1)}k`
    return `R$ ${valueBrl.toFixed(0)}`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valueBrl)
}

export function fmtPct(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace('.', ',')}%`
}

export function fmtDelta(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${fmtPct(value, digits)}`
}

export function fmtDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}
