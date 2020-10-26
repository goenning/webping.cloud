export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function timeout(ms: number): Promise<void> {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error('timeout'))
    }, ms)
  })
}

export async function ping(url: string): Promise<number> {
  return new Promise((resolve) => {
    const actualUrl = url.startsWith('https://dynamodb') ? url : `${url}?${new Date().getTime()}`
    const start = new Date().getTime()
    const request = fetch(actualUrl, { method: 'GET', cache: 'no-store', mode: 'no-cors', keepalive: false })
    return Promise.race([request, timeout(2000)])
      .then(() => resolve(new Date().getTime() - start))
      .catch(() => resolve(new Date().getTime() - start))
  })
}
