export interface BolHerosTraitsModel {
  id?: number,
  traitable_id: number,
  type: 'A' | 'D',
  detail: string | null,
  region_id: number | null
}
