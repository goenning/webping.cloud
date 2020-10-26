import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { CloudProvider, CloudRegion, getAllCloudRegions, getAllProviders } from '../../data'
import { GetStaticPropsResult } from 'next'

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

function median(values: number[]): number {
  const copy = [...values]
  copy.sort()

  if (copy.length === 0) {
    return 0
  }

  const half = Math.floor(copy.length / 2)
  if (copy.length % 2) {
    return copy[half]
  }
  return (copy[half - 1] + copy[half]) / 2.0
}

export async function getStaticProps(): Promise<GetStaticPropsResult<HomeProps>> {
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ping(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = document.getElementById('url-ping') as HTMLImageElement
    const timeout = setTimeout(() => {
      img.src = ''
      reject()
    }, 2000)
    const start = new Date().getTime()
    const cb = () => {
      clearTimeout(timeout)
      resolve(new Date().getTime() - start)
    }
    img.onerror = img.onload = cb
    img.src = url.startsWith('http://dynamodb') ? url : `${url}?${start}`
  })
}

export default function CloudPing(props: CloudPingProps): JSX.Element {
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

        const start = new Date().getTime()

        try {
          await ping(`${region.ping_url}`)
          // eslint-disable-next-line no-empty
        } catch {
        } finally {
          setLatencyState((x) => {
            const key = `${provider.key}-${region.key}`
            const latencies = [...(x[key]?.latencies || []), new Date().getTime() - start]
            const latest: RegionLatency = {
              key,
              provider,
              region,
              medianLatency: median(latencies),
              latencies,
            }
            return { ...x, ...{ [key]: latest } }
          })
        }
      }
    }

    if (!cancelToken.cancel) {
      await delay(500)
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

  const toggleProviderFilter = (providerKey: string) => () => {
    setSelectedProviders((values) => {
      if (values.includes(providerKey)) {
        return values.filter((x) => x !== providerKey)
      } else {
        return [...values, providerKey]
      }
    })
  }

  const toggleCountryFilter = (countryCode: string) => () => {
    setSelectedCountries((values) => {
      if (values.includes(countryCode)) {
        return values.filter((x) => x !== countryCode)
      } else {
        return [...values, countryCode]
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
        <title>Sumbit</title>
      </Head>

      <img src="" id="url-ping" alt="Ping" style={{ display: 'none' }} />

      <div className="flex">
        <div className="mr-4">
          <h4>Providers</h4>
          {props.providers.map((provider) => (
            <div key={provider.key}>
              <input type="checkbox" defaultChecked={selectedProviders.includes(provider.key)} onChange={toggleProviderFilter(provider.key)} />
              {provider.display_name}
            </div>
          ))}
        </div>

        <div>
          <h4>Locations</h4>

          <div className="flex">
            {Object.keys(props.continents).map((continent) => {
              const allSelected = props.continents[continent].some((x) => selectedCountries.includes(x))
              return (
                <div key={continent} className="mr-4">
                  <div>
                    <input type="checkbox" defaultChecked={allSelected} onChange={toggleContinentFilter(continent)} />
                    <h6 className="inline">{continent}</h6>
                  </div>
                  <div key={continent}>
                    {props.continents[continent].map((country) => (
                      <div key={country}>
                        <input type="checkbox" defaultChecked={selectedCountries.includes(country)} onChange={toggleCountryFilter(country)} />
                        <img className="w-5 inline" src={`/images/country/${country.toLowerCase()}.svg`} title={country} alt={country} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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
                <td>
                  <div className="flex">
                    <img className="w-8 inline" src={`/images/provider/${x.provider.key}.svg`} title={x.provider.display_name} alt={x.provider.display_name} />
                    <div className="ml-4">
                      <span>{x.region.key}</span>
                      <div className="flex mt-1">
                        <img
                          className="w-5 inline"
                          src={`/images/country/${x.region.country.toLowerCase()}.svg`}
                          title={x.region.country}
                          alt={x.region.country}
                        />
                        <span className="ml-1">&middot;</span>
                        <span className="ml-1">
                          {x.region.location}, {x.region.country}
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
    </>
  )
}
