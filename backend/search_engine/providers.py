
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from .whitelist import PROVIDER_WHITELISTS

from urllib.parse import urlparse


def is_trusted_url(url, domains):
    try:
        hostname = urlparse(url).hostname

        if not hostname:
            return False

        hostname = hostname.lower()

        return any(
            hostname == domain or
            hostname.endswith("." + domain)
            for domain in domains
        )

    except (ValueError, TypeError):
        return False

def filter_provider_results(provider_results):
    filtered = {}

    for provider_name, data in provider_results.items():

        # Keep provider errors unchanged
        if "error" in data:
            filtered[provider_name] = data
            continue

        domains = PROVIDER_WHITELISTS.get(provider_name, [])

        filtered_results = []

        for item in data.get("results", []):
            url = item.get("url") or item.get("link")

            if is_trusted_url(url, domains):
                filtered_results.append(item)

        filtered[provider_name] = {
            **data,
            "results": filtered_results
        }

    return filtered

def merge_results(provider_results):
    merged = []
    seen_urls = set()

    for provider_name, data in provider_results.items():

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

            normalized_url = url.rstrip("/").lower()

            if normalized_url in seen_urls:
                continue

            seen_urls.add(normalized_url)

            merged.append({
                "title": title,
                "url": url,
                "snippet": snippet,
                "source": provider_name.capitalize()
            })

    return merged

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



def search_google(query, domains):
    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise RuntimeError("SERPAPI_API_KEY is not configured")

    restricted_query = (
        f"{query} "
        + "("
        + " OR ".join(f"site:{domain}" for domain in domains)
        + ")"
    )

    response = send_get_request(
        "https://serpapi.com/search",
        params={
            "engine": "google",
            "q": restricted_query,
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


def search_tavily(query, domains):
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
            "max_results": 10,
            "include_domains": domains
        },
        timeout=15
    )

    response.raise_for_status()
    data = response.json()

    return {
        "provider": "Tavily",
        "results": data.get("results", [])
    }


def search_exa(query, domains):
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
            "numResults": 10,
            "includeDomains": domains
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
            domains = PROVIDER_WHITELISTS.get(name, [])

            if not domains:
                results[name] = {
                    "provider": name,
                    "error": "No trusted domains configured",
                    "results": []
                }
                continue

            future = executor.submit(
                search_function,
                query,
                domains
            )

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

    return filter_provider_results(results)



