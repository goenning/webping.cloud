import { NextApiRequest, NextApiResponse } from 'next'
import { CloudRegion, getAllCloudRegions, getAllProviders } from '@app/data'

interface ApiResponseItem {
  key: string
  display_name: string
  regions: CloudRegion[]
}

export default (_req: NextApiRequest, res: NextApiResponse): void => {
  const providers = getAllProviders()
  const regions = getAllCloudRegions()
  const items: ApiResponseItem[] = []
  for (const provider of providers) {
    items.push({
      key: provider.key,
      display_name: provider.display_name,
      regions: regions[provider.key],
    })
  }

  res.status(200).json(items)
}
