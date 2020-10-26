import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '@app/data'
import { GetStaticPropsResult } from 'next'
import { CloudProviderLogo, CountryFlag, CountryName } from '@app/components'
import { median } from '@app/fns/math'
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
  medianLatency: number
  latencies: number[]
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
    await delay(500)

    for (const provider of props.providers) {
      for (const region of props.regions[provider.key]) {
        if (cancelToken.cancel) {
          return
        }

        if (!region.ping_url || !selectedCountries.includes(region.country) || !selectedProviders.includes(provider.key)) {
          continue
        }

        try {
          const latency = await ping(`${region.ping_url}`)
          setLatencyState((x) => {
            const key = `${provider.key}-${region.key}`
            const latencies = [...(x[key]?.latencies || []), latency]
            const latest: RegionLatency = {
              key,
              provider,
              region,
              medianLatency: median(latencies),
              latencies,
            }
            return { ...x, ...{ [key]: latest } }
          })
          // eslint-disable-next-line no-empty
        } catch {}
      }
    }

    if (!cancelToken.cancel) {
      await delay(2000)
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
    .sort((a, b) => a.medianLatency - b.medianLatency)
  const maxLatency = sortedRegions.length >= 1 ? sortedRegions[sortedRegions.length - 1].medianLatency : 0

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
        <title>webping.cloud</title>
      </Head>

      <div className="container mx-auto flex flex-wrap py-6">
        <div className="px-3 w-full mb-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden border-gray-400 bg-white rounded shadow font-bold rounded py-2 px-4 inline-flex items-center focus:outline-none float-right"
          >
            <span>Filters</span>
            {!isFilterOpen && <img src="/images/stripes.svg" alt="Show Filters" className="ml-2 w-4 h-4" />}
            {isFilterOpen && <img src="/images/close.svg" alt="Close Filters" className="ml-2 w-4 h-4" />}
          </button>
        </div>
        <aside className={`w-full md:w-1/3 flex flex-col px-3 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h4>Providers</h4>
            {props.providers.map((provider) => (
              <div key={provider.key}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={selectedProviders.includes(provider.key)}
                  onChange={toggleProviderFilter(provider.key)}
                />
                <CloudProviderLogo className="w-5 ml-1" providerKey={provider.key} providerName={provider.display_name} />
                <span className="ml-1">{provider.display_name}</span>
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
                    <div>
                      <input type="checkbox" className="form-checkbox" checked={allSelected} onChange={toggleContinentFilter(continent)} />
                      <h6 className="inline ml-1">{continent}</h6>
                    </div>
                    <div key={continent}>
                      {props.continents[continent].map((country, idx) => {
                        const isLastCountry = idx === props.continents[continent].length - 1
                        return (
                          <label className={`flex items-center ${isLastCountry && 'mb-4'}`} key={country}>
                            <input
                              type="checkbox"
                              className="form-checkbox"
                              checked={selectedCountries.includes(country)}
                              onChange={toggleCountryFilter(country)}
                            />
                            <CountryFlag countryCode={country} className="w-5 ml-1" /> {}
                            <CountryName countryCode={country} className="ml-1" />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
        <section className="w-full md:w-2/3 flex flex-col items-center px-3">
          <img src="" id="url-ping" alt="Ping" style={{ display: 'none' }} />

          <table style={{ width: '100%', borderSpacing: '5px', borderCollapse: 'separate' }}>
            <tbody>
              {sortedRegions.map((x) => {
                const relative = ((x.medianLatency || 0) / maxLatency) * 100
                const color = x.medianLatency < 80 ? 'ddffdd' : x.medianLatency < 200 ? 'fff0cc' : 'ffdddd'
                return (
                  <tr
                    key={x.key}
                    style={{
                      backgroundImage: `linear-gradient(to right, #${color} ${relative}%, #fff ${relative}%)`,
                    }}
                  >
                    <td className="rounded">
                      <div className="flex">
                        <CloudProviderLogo className="w-8 ml-4" providerKey={x.provider.key} providerName={x.provider.display_name} />
                        <div className="ml-4">
                          <span>{x.region.key}</span>
                          <div className="flex mt-1">
                            <CountryFlag countryCode={x.region.country} className="w-5" />
                            <span className="ml-1">&middot;</span>
                            <span className="ml-1">
                              {x.region.location}, <CountryName countryCode={x.region.country} />
                            </span>
                            <span className="ml-1">&middot;</span>
                            <span className="ml-1">{x.medianLatency}ms</span>
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
