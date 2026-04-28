export const KIRA_VERISI: Record<string, number> = {
  sariyer:       64454,
  besiktas:      61512,
  kadikoy:       52731,
  bakirkoy:      42820,
  adalar:        37500,
  sile:          36351,
  beykoz:        33678,
  uskudar:       32445,
  sisli:         31206,
  atasehir:      30965,
  beyoglu:       30596,
  maltepe:       29748,
  eyupsultan:    28528,
  basaksehir:    28324,
  kartal:        27842,
  umraniye:      27567,
  zeytinburnu:   27198,
  buyukcekmece:  26853,
  beylikduzu:    25951,
  tuzla:         25422,
  kagithane:     25409,
  pendik:        24888,
  cekmekoy:      24558,
  kucukcekmece:  23969,
  gaziosmanpasa: 22267,
  sancaktepe:    22177,
  bahcelievler:  21513,
  bayrampasa:    21042,
  catalca:       21019,
  gungoren:      20918,
  sultanbeyli:   20754,
  avcilar:       20426,
  silivri:       20102,
  bagcilar:      19692,
  fatih:         19268,
  sultangazi:    18164,
  esenler:       17199,
  arnavutkoy:    17180,
  esenyurt:      16717,
}

export function kiraEtiketi(kira: number): string {
  if (kira >= 50000) return 'Çok Pahalı'
  if (kira >= 35000) return 'Pahalı'
  if (kira >= 25000) return 'Orta'
  if (kira >= 18000) return 'Uygun'
  return 'Çok Uygun'
}

export function kiraRengi(kira: number): string {
  if (kira >= 50000) return '#ef4444'
  if (kira >= 35000) return '#f97316'
  if (kira >= 25000) return '#f59e0b'
  if (kira >= 18000) return '#10b981'
  return '#16a34a'
}
