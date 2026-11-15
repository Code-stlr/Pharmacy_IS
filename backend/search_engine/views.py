from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from search_engine.providers import (
    search_google,
    search_tavily,
    search_exa,
    search_providers
)

@api_view(["GET"])
@permission_classes([AllowAny])
def metasearch(request):
    query = request.query_params.get("q", "").strip()

    if not query:
        return Response({
            "error": "Search query is required"
        }, status=400)

    providers = {
        "google": search_google,
        "tavily": search_tavily,
        "exa": search_exa
    }

    results = search_providers(query, providers)

    return Response({
        "query": query,
        "results": results
    })