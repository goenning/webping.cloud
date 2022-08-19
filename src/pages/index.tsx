import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { GetStaticPropsResult } from 'next'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '@app/data'
import { Advertisement, CloudProviderLogo, CountryFlag, CountryName, FAQ } from '@app/components'
import { delay, ping } from '@app/fns/time'

interface CloudPingProps {
  providers: CloudProvider[]
  geos: Record<string, string[]>
  countries: string[]
  initialState: LatencyState
}

export async function getStaticProps(): Promise<GetStaticPropsResult<CloudPingProps>> {
  const providers = getAllProviders()
  const regions = getAllCloudRegions()

  const initialState: LatencyState = {}
  for (const provider of providers) {
    for (const region of regions[provider.key]) {
      const key = `${provider.key}-${region.key}`
      initialState[key] = {
        key,
        provider,
        region,
      }
    }
  }

  return {
    props: {
      initialState,
      providers,
      geos: Object.values(regions).reduce((prev, curr) => {
        for (const region of curr) {
          if (!prev[region.geo]) {
            prev[region.geo] = []
          }
          if (!prev[region.geo].includes(region.country)) {
            prev[region.geo] = [...prev[region.geo], region.country]
          }
        }
        return prev
      }, {} as Record<string, string[]>),
      countries: Object.values(regions).reduce((prev, curr) => {
        for (const region of curr) {
          if (!prev.includes(region.country)) {
            prev = [...prev, region.country]
          }
        }
        return prev
      }, [] as string[]),
    },
  }
}

interface LatencyState {
  [key: string]: RegionLatency
}

interface RegionLatency {
  key: string
  provider: CloudProvider
  region: CloudRegion
  latency?: number
}

export default function CloudPing(props: CloudPingProps): JSX.Element {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedProviders, setSelectedProviders] = useState(props.providers.map((x) => x.key))
  const [selectedCountries, setSelectedCountries] = useState(props.countries)
  const [latencyState, setLatencyState] = useState<LatencyState>(props.initialState)

  async function pingAll(cancelToken: { cancel: boolean }) {
    await delay(1000)

    const shuffledItems = Object.values(latencyState).sort(() => 0.5 - Math.random())
    for (const item of shuffledItems) {
      if (cancelToken.cancel) {
        return
      }

      if (!item.region.ping_url || !selectedCountries.includes(item.region.country) || !selectedProviders.includes(item.provider.key)) {
        continue
      }

      try {
        await ping(`${item.region.ping_url}`)
        const latency = await ping(`${item.region.ping_url}`)
        setLatencyState((x) => {
          const newItem = { ...x[item.key] }
          newItem.latency = newItem.latency && newItem.latency < latency ? newItem.latency : latency
          return { ...x, ...{ [item.key]: newItem } }
        })
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (!cancelToken.cancel) {
      await delay(1000)
      await pingAll(cancelToken)
    }
  }

  useEffect(() => {
    const cancelToken = { cancel: false }
    if (selectedProviders.length >= 1 && selectedCountries.length >= 1) {
      pingAll(cancelToken)
    }
    return () => {
      cancelToken.cancel = true
      return
    }
  }, [selectedProviders, selectedCountries])

  const filteredRegions = Object.values(latencyState).filter((x) => selectedProviders.includes(x.provider.key) && selectedCountries.includes(x.region.country))
  const sortedRegionsWithLatency = filteredRegions.filter((x) => x.latency).sort((a, b) => (a.latency && b.latency ? a.latency - b.latency : 1))
  const othersRegions = filteredRegions.filter((x) => !x.latency)
  const sortedRegions = [...sortedRegionsWithLatency, ...othersRegions]
  const maxLatency = sortedRegionsWithLatency.length > 1 ? sortedRegionsWithLatency[sortedRegionsWithLatency.length - 1].latency : 0

  const toggleProviderFilter = (providerKey: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedProviders((values) => {
      if (event.target.checked) {
        return [...values, providerKey]
      } else {
        return values.filter((x) => x !== providerKey)
      }
    })
  }

  const toggleCountryFilter = (countryCode: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCountries((values) => {
      if (event.target.checked) {
        return [...values, countryCode]
      } else {
        return values.filter((x) => x !== countryCode)
      }
    })
  }

  const toggleGeographyFilter = (geo: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCountries((values) => {
      if (event.target.checked) {
        return [...new Set([...values, ...props.geos[geo]])]
      } else {
        return values.filter((x) => !props.geos[geo].includes(x))
      }
    })
  }

  const title = 'Simultaneous ping test for all popular cloud providers · webping.cloud'
  const description =
    'Test your network latency to the nearest cloud provider in Microsoft Azure, Amazon Web Services, Google Cloud Platform and other cloud providers directly from your browser'

  let tweetText = ''
  if (sortedRegions.length > 0) {
    const nearestRegion = sortedRegions[0].region
    const nearestProvider = sortedRegions[0].provider
    const nearestLatency = `${sortedRegions[0].latency || 0}ms`
    tweetText = `My nearest cloud data center is in ${nearestRegion.location}, ${nearestRegion.country} (${nearestRegion.key}) from #${nearestProvider.key} (${nearestLatency}). Find yours on https://webping.cloud`
  }

  return (
    <>
      <Head>
        <title>Ping test for Azure, AWS, GCP and others · webping.cloud</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:url" content="https://webping.cloud" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://webping.cloud/images/large-screenshot.png" />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:url" content="https://webping.cloud" />
        <meta name="twitter:image" content="https://webping.cloud/images/large-screenshot.png" />
      </Head>

      <div className="container mx-auto flex flex-wrap py-6">
        <div className="px-4 w-full mb-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden border-gray-400 bg-white rounded shadow font-bold py-2 px-4 inline-flex items-center focus:outline-none float-right"
          >
            {!isFilterOpen && <img src="/images/stripes.svg" alt="Show Filters" className="ml-0 w-4 h-4" />}
            {isFilterOpen && <img src="/images/close.svg" alt="Close Filters" className="ml-0 w-4 h-4" />}
          </button>
          <h1 className="block md:hidden">Cloud Ping Test</h1>
        </div>
        <aside className={`w-full md:w-1/3 flex flex-col px-3 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h4>Providers</h4>
            {props.providers.map((provider) => (
              <div key={provider.key}>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={selectedProviders.includes(provider.key)}
                    onChange={toggleProviderFilter(provider.key)}
                  />
                  <div className="w-5 ml-1 flex">
                    <CloudProviderLogo width="20px" providerKey={provider.key} providerName={provider.display_name} />
                  </div>
                  <span className="ml-1">{provider.display_name}</span>
                </label>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mt-4">Locations</h4>

            <div className="grid grid-cols-2 md:block">
              {['North America', 'Middle East', 'Asia', 'Europe', 'South America', 'Oceania', 'Africa'].map((geo) => {
                const allSelected = props.geos[geo].some((x) => selectedCountries.includes(x))
                return (
                  <div key={geo} className="mr-3 md:mr-0">
                    <label className="inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="form-checkbox cursor-pointer" checked={allSelected} onChange={toggleGeographyFilter(geo)} />
                      <h6 className="inline ml-1">{geo}</h6>
                    </label>
                    <div key={geo}>
                      {props.geos[geo].map((country, idx) => {
                        const isLastCountry = idx === props.geos[geo].length - 1
                        return (
                          <div key={country}>
                            <label className={`inline-flex cursor-pointer items-center ${isLastCountry && 'mb-4'}`}>
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={selectedCountries.includes(country)}
                                onChange={toggleCountryFilter(country)}
                              />
                              <div className="w-5 ml-1 flex">
                                <CountryFlag width="20px" countryCode={country} />
                              </div>
                              <CountryName countryCode={country} className="ml-1" />
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <FAQ />
          <Advertisement />
        </aside>
        <section className="w-full md:w-2/3 flex flex-col px-3">
          <img src="" id="url-ping" alt="Ping" style={{ display: 'none' }} />
          <h1 className="hidden md:block">Cloud Ping Test</h1>

          <table style={{ width: '100%', borderSpacing: '5px', borderCollapse: 'separate' }}>
            <tbody>
              {sortedRegions.map((x) => {
                const relative = ((x.latency || 0) / (maxLatency || 1)) * 100
                const color = x.latency && x.latency < 80 ? 'ddffdd' : x.latency && x.latency < 200 ? 'fff0cc' : 'ffdddd'
                return (
                  <tr
                    key={x.key}
                    style={{
                      backgroundImage: `linear-gradient(to right, #${color} ${relative}%, #fff ${relative}%)`,
                    }}
                  >
                    <td className="rounded py-1">
                      <div className="flex items-center">
                        <div className="w-8 ml-3">
                          <CloudProviderLogo width="30px" providerKey={x.provider.key} providerName={x.provider.display_name} />
                        </div>
                        <div className="ml-3">
                          <span>{x.region.key}</span>
                          <div className="flex items-center">
                            <CountryFlag width="20px" countryCode={x.region.country} />
                            <span className="ml-1">
                              &middot; {x.region.location}, {x.region.country} {x.latency && <>&middot; {x.latency}ms</>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        {tweetText && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block fixed bottom-4 right-4"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
          >
            <div className="bt-tweet text-white font-medium py-2 px-2 lg:px-4 rounded-full h-10 flex cursor-pointer">
              <svg className="text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
                />
              </svg>
              <span className="hidden lg:block ml-2">Tweet my result</span>
            </div>
          </a>
        )}
      </div>
    </>
  )
}
