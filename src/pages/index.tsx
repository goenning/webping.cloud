import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '@app/data'
import { GetStaticPropsResult } from 'next'
import { CloudProviderLogo, CountryFlag, CountryName } from '@app/components'
import { delay, ping } from '@app/fns/time'

interface CloudPingProps {
  providers: CloudProvider[]
  continents: Record<string, string[]>
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
      continents: Object.values(regions).reduce((prev, curr) => {
        for (const region of curr) {
          if (!prev[region.continent]) {
            prev[region.continent] = []
          }
          if (!prev[region.continent].includes(region.country)) {
            prev[region.continent] = [...prev[region.continent], region.country]
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

  const toggleContinentFilter = (continent: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCountries((values) => {
      if (event.target.checked) {
        return [...new Set([...values, ...props.continents[continent]])]
      } else {
        return values.filter((x) => !props.continents[continent].includes(x))
      }
    })
  }

  return (
    <>
      <Head>
        <title>Cloud Ping Test · webping.cloud</title>
        <meta
          name="description"
          content="Test your network latency to the nearest cloud provider in AWS, Azure, GCP and DigitalOcean directly from your browser"
        />
        <meta property="og:title" content="Cloud Ping Test test for popular providers" />
        <meta property="og:url" content="https://webping.cloud" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://webping.cloud/images/large-screenshot.png" />
        <meta
          property="og:description"
          content="Test your network latency to the nearest cloud provider in AWS, Azure, GCP and DigitalOcean directly from your browser"
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Cloud Ping Test for popular providers" />
        <meta
          name="twitter:description"
          content="Test your network latency to the nearest cloud provider in AWS, Azure, GCP and DigitalOcean directly from your browser"
        />
        <meta name="twitter:url" content="https://webping.cloud" />
        <meta name="twitter:image" content="https://webping.cloud/images/large-screenshot.png" />
      </Head>

      <div className="container mx-auto flex flex-wrap py-6">
        <div className="px-4 w-full mb-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden border-gray-400 bg-white rounded shadow font-bold rounded py-2 px-4 inline-flex items-center focus:outline-none float-right"
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
                  <div className="w-5 ml-1">
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
              {['North America', 'Middle East', 'Asia', 'Europe', 'South America', 'Oceania', 'Africa'].map((continent) => {
                const allSelected = props.continents[continent].some((x) => selectedCountries.includes(x))
                return (
                  <div key={continent} className="mr-3 md:mr-0">
                    <label className="inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="form-checkbox cursor-pointer" checked={allSelected} onChange={toggleContinentFilter(continent)} />
                      <h6 className="inline ml-1">{continent}</h6>
                    </label>
                    <div key={continent}>
                      {props.continents[continent].map((country, idx) => {
                        const isLastCountry = idx === props.continents[continent].length - 1
                        return (
                          <div key={country}>
                            <label className={`inline-flex cursor-pointer items-center ${isLastCountry && 'mb-4'}`}>
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={selectedCountries.includes(country)}
                                onChange={toggleCountryFilter(country)}
                              />
                              <div className="w-5 ml-1">
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
          <div className="mb-4">
            <h4>FAQ</h4>
            <div className="mt-2">
              <span className="font-medium">1. How does it work?</span>
              <p className="text-gray-700">This website constantly sends a HTTP request to a server in each region/cloud provider.</p>
            </div>
            <div className="mt-2">
              <span className="font-medium">2. How accurate is it?</span>
              <p className="text-gray-700">
                It can be considered fairly accurate for general public usage, but due to browser restrictions, this website uses a HTTP ping instead of a
                TCP/ICMP ping. HTTP ping will always have an additional overhead, which can negatively impact the latency displayed here.
              </p>
            </div>
            <div className="mt-2">
              <span className="font-medium">3. Is it fair to compare different providers?</span>
              <p className="text-gray-700">
                In most cases, no. Each provider uses a different HTTP web server which can add a few extra milliseconds. When pinging multiple providers
                simultaneously, always keep in mind that some providers might actually have a slighly lower latency than what is currently displayed.
              </p>
            </div>
            <div className="mt-2">
              <span className="font-medium">4. Any accurate alternative?</span>
              <p className="text-gray-700">Yes, you should use a ICMP/TCP tool for that.</p>
            </div>
          </div>
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
      </div>
    </>
  )
}
