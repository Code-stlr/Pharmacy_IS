
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed


def send_get_request(url, params=None, headers=None):
    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=10
    )

    response.raise_for_status()

    return response


def search_multiple_sources(sources):
    results = {}

    with ThreadPoolExecutor(max_workers=3) as executor:

        futures = {}

        for name, url in sources.items():
            future = executor.submit(send_get_request, url)
            futures[future] = name

        for future in as_completed(futures):
            name = futures[future]

            try:
                response = future.result()
                results[name] = response.json()

            except requests.RequestException as error:
                results[name] = {"error": str(error)}

    return results



import os


def search_google(query):
    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY is not configured")

    response = send_get_request(
        "https://serpapi.com/search",
        params={
            "engine": "google",
            "q": query,
            "api_key": api_key
        }
    )

    data = response.json()

    if "error" in data:
        raise RuntimeError(data["error"])

    return {
        "provider": "Google",
        "results": data.get("organic_results", [])
    }
def search_tavily(query):
    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        raise RuntimeError("TAVILY_API_KEY is not configured")

    response = requests.post(
        "https://api.tavily.com/search",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "query": query,
            "search_depth": "basic",
            "max_results": 10
        },
        timeout=15
    )

    response.raise_for_status()
    data = response.json()

    return {
        "provider": "Tavily",
        "results": data.get("results", [])
    }
def search_exa(query):
    api_key = os.getenv("EXA_API_KEY")

    if not api_key:
        raise RuntimeError("EXA_API_KEY is not configured")

    response = requests.post(
        "https://api.exa.ai/search",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "query": query,
            "type": "fast",
            "numResults": 10
        },
        timeout=15
    )

    response.raise_for_status()
    data = response.json()

    return {
        "provider": "Exa",
        "results": data.get("results", [])
    }
    

def search_providers(query, providers):
    results = {}

    with ThreadPoolExecutor(max_workers=len(providers)) as executor:
        futures = {}

        for name, search_function in providers.items():
            future = executor.submit(search_function, query)
            futures[future] = name

        for future in as_completed(futures):
            name = futures[future]

            try:
                results[name] = future.result()

            except Exception as error:
                results[name] = {
                    "provider": name,
                    "error": str(error),
                    "results": []
                }

    return results


def normalize_results(provider_results):
    normalized = []

    for provider_name, data in provider_results.items():

        # Skip providers that returned an error
        if "error" in data:
            continue

        for item in data.get("results", []):

            title = item.get("title")
            url = item.get("url") or item.get("link")
            snippet = (
                item.get("snippet")
                or item.get("content")
                or item.get("text")
                or ""
            )

            if not title or not url:
                continue

            normalized.append({
                "title": title,
                "url": url,
                "snippet": snippet,
                "source": provider_name.capitalize()
            })

    return normalized
