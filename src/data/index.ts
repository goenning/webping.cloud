import providers from './datasource/providers.json'

export interface CloudProvider {
  key: string
  display_name: string
}

export interface CloudRegion {
  key: string
  display_name: string
  country: string
  location: string
  geo: string
  ping_url: string
}

export function getAllProviders(): CloudProvider[] {
  return providers
}

export function getAllCloudRegions(): Record<string, CloudRegion[]> {
  const result: Record<string, CloudRegion[]> = {}
  for (const provider of providers) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    result[provider.key] = require(`./datasource/regions/${provider.key}.json`)
  }
  return result
}
