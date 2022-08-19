export function FAQ() {
  return (
    <>
      <div className="my-8 flex">
        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <p className="ml-2 text-gray-700">
          This website is{' '}
          <a className="text-blue-700 text-bold" href="https://github.com/goenning/webping.cloud">
            open source
          </a>
          .
        </p>
      </div>
      <div className="mb-4">
        <h4>FAQ</h4>
        <div className="mt-3">
          <span className="font-medium">1. How does it work?</span>
          <p className="text-gray-700">This website constantly sends a HTTP request to a server in each region/cloud provider.</p>
        </div>
        <div className="mt-3">
          <span className="font-medium">2. How accurate is it?</span>
          <p className="text-gray-700">
            It&quot;s fairly accurate, but due to browser restrictions, this website uses a HTTP ping instead of a TCP/ICMP ping. HTTP servers will always have
            an additional overhead which negatively impact the latency displayed here.
          </p>
        </div>
        <div className="mt-3">
          <span className="font-medium">3. Is it fair to compare different providers?</span>
          <p className="text-gray-700">
            Each provider uses a different HTTP web server and configuration that could a few extra milliseconds. When pinging multiple providers
            simultaneously, always keep in mind that some providers might have a slighly lower latency than what is currently displayed.
          </p>
        </div>
        <div className="mt-3">
          <span className="font-medium">4. Is there a more accurate alternative?</span>
          <p className="text-gray-700">Yes, you should use a ICMP/TCP tool for that.</p>
        </div>
        <div className="mt-8">
          <span className="font-medium">Tip!</span> You can use a VPN to test the latency from different locations.
        </div>
      </div>
    </>
  )
}
