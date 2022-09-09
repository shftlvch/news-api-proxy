
export interface Env {
	ENDPOINT: string,
	API_KEY: string,
	CACHE_TTL: number,
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const origin = request.headers.get("Origin") || "*"
		switch (request.method) {
			case "OPTIONS":
				return new Response(undefined, {
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
						"Access-Control-Allow-Methods": "GET,OPTIONS",
						"Access-Control-Max-Age": "86400",
						"Access-Control-Allow-Headers": "Content-Type"
					},
				})
			case "GET":
				const url = new URL(request.url)

				const apiUrl = new URL(env.ENDPOINT + url.pathname)
				for (let [param, val] of url.searchParams) {
					apiUrl.searchParams.append(param, val)
				}

				request = new Request(apiUrl.toString(), {
					...request, cf: {
						cacheTtl: env.CACHE_TTL,
						cacheEverything: true,
					}
				})
				request.headers.set('Origin', apiUrl.origin)
				request.headers.set('Authorization', env.API_KEY)

				let response = await fetch(request)
				response = new Response(response.body, response)

				// Set CORS headers
				response.headers.set('Access-Control-Allow-Origin', origin)

				// Append to/Add Vary header so browser will cache response correctly
				response.headers.append('Vary', 'Origin')

				return response
			default:
				return new Response(`Method ${request.method} is not allowed.`, {
					status: 405,
					headers: {
						Allow: "GET",
					},
				})
		}
	},
}
