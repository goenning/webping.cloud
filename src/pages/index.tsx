import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '@app/data'
import { GetStaticPropsResult } from 'next'
import { CloudProviderLogo, CountryFlag, CountryName } from '@app/components'
import { delay, ping } from '@app/fns/time'

interface CloudPingProps {
  providers: CloudProvider[]
  regions: Record<string, CloudRegion[]>
  continents: Record<string, string[]>
  countries: string[]
}

interface RegionLatency {
  key: string
  provider: CloudProvider
  region: CloudRegion
  latency: number
}

export async function getStaticProps(): Promise<GetStaticPropsResult<CloudPingProps>> {
  const providers = getAllProviders()
  const regions = getAllCloudRegions()

  return {
    props: {
      providers,
      regions,
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

export default function CloudPing(props: CloudPingProps): JSX.Element {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedProviders, setSelectedProviders] = useState(props.providers.map((x) => x.key))
  const [selectedCountries, setSelectedCountries] = useState(props.countries)
  const [latencyState, setLatencyState] = useState<{ [key: string]: RegionLatency }>({})

  async function pingAll(cancelToken: { cancel: boolean }) {
    await delay(1000)

    for (const provider of props.providers) {
      for (const region of props.regions[provider.key]) {
        if (cancelToken.cancel) {
          return
        }

        if (!region.ping_url || !selectedCountries.includes(region.country) || !selectedProviders.includes(provider.key)) {
          continue
        }

        try {
          await ping(`${region.ping_url}`)
          const latency = await ping(`${region.ping_url}`)
          setLatencyState((x) => {
            const key = `${provider.key}-${region.key}`
            const prevLatency = x[key]?.latency
            const latest: RegionLatency = {
              key,
              provider,
              region,
              latency: latency < prevLatency || !prevLatency ? latency : prevLatency,
            }
            return { ...x, ...{ [key]: latest } }
          })
          // eslint-disable-next-line no-empty
        } catch {}
      }
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

  const sortedRegions = Object.values(latencyState)
    .filter((x) => selectedProviders.includes(x.provider.key) && selectedCountries.includes(x.region.country))
    .sort((a, b) => a.latency - b.latency)
  const maxLatency = sortedRegions.length >= 1 ? sortedRegions[sortedRegions.length - 1].latency : 0

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
          content="Test your network latency to the nearest cloud provider in AWS, Azure, GCP and DigitalOcean directly from your browser."
        />
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
                  <CloudProviderLogo className="w-5 ml-1" providerKey={provider.key} providerName={provider.display_name} />
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
                              <CountryFlag countryCode={country} className="w-5 ml-1" />
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
              <p className="text-gray-700">
                You will need a ICMP/TCP tool for that. Use{' '}
                <a href="#" className="text-blue-700 hover:underline">
                  webcloud.ping-cli
                </a>{' '}
                to test multiple cloud providers directly from your terminal.
              </p>
            </div>
          </div>
        </aside>
        <section className="w-full md:w-2/3 flex flex-col items-center px-3">
          <img src="" id="url-ping" alt="Ping" style={{ display: 'none' }} />

          <table style={{ width: '100%', borderSpacing: '5px', borderCollapse: 'separate' }}>
            <tbody>
              {sortedRegions.map((x) => {
                const relative = ((x.latency || 0) / maxLatency) * 100
                const color = x.latency < 80 ? 'ddffdd' : x.latency < 200 ? 'fff0cc' : 'ffdddd'
                return (
                  <tr
                    key={x.key}
                    style={{
                      backgroundImage: `linear-gradient(to right, #${color} ${relative}%, #fff ${relative}%)`,
                    }}
                  >
                    <td className="rounded py-1">
                      <div className="flex items-center">
                        <CloudProviderLogo className="w-8 ml-3" providerKey={x.provider.key} providerName={x.provider.display_name} />
                        <div className="ml-3">
                          <span>{x.region.key}</span>
                          <div className="flex items-center">
                            <CountryFlag countryCode={x.region.country} className="w-5" />
                            <span className="ml-1">
                              &middot; {x.region.location}, {x.region.country} &middot; {x.latency}ms
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
