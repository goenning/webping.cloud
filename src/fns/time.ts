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
    img.src = url.startsWith('https://dynamodb') ? url : `${url}?${start}`
  })
}
