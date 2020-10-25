import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '../data'
import { GetStaticPropsResult } from 'next'

interface HomeProps {
  providers: CloudProvider[]
  regions: Record<string, CloudRegion[]>
}

interface RegionLatency {
  provider: CloudRegion
  region: CloudProvider
  meanLatency: number
}

async function ping(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = document.getElementById('url-ping') as HTMLImageElement
    const start = new Date().getTime()
    img.onload = () => {
      resolve(new Date().getTime() - start)
    }
    img.onerror = img.onload
    img.src = url
  })
}

export async function getStaticProps(): Promise<GetStaticPropsResult<HomeProps>> {
  const providers = getAllProviders()
  const regions = getAllCloudRegions()

  return {
    props: {
      providers,
      regions,
    },
  }
}

export default function Home(props: HomeProps): JSX.Element {
  const [latencyState, setLatencyState] = useState<Record<string, RegionLatency>>({})
  useEffect(() => {
    console.log('Hi')
  }, [])

  return (
    <>
      <Head>
        <title>Sumbit</title>
      </Head>

      <div>
        {props.providers.map((p) => (
          <React.Fragment key={p.key}>
            {props.regions[p.key].map((r) => (
              <div key={r.key}>
                {p.display_name} &middot; {r.display_name}
              </div>
            ))}
          </React.Fragment>
        ))}
        <img style={{ display: 'none' }} id="url-ping" alt="ping"></img>
      </div>
    </>
  )
}
