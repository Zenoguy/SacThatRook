import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const urlObj = new URL(request.url);
    const bypassCache = urlObj.searchParams.get('nocache') === 'true';
    
    // Strip nocache from the search params so Chess.com doesn't receive it
    urlObj.searchParams.delete('nocache');
    const searchParams = urlObj.searchParams.toString();
    const chessPath = path.join('/');
    
    // Chess.com PubAPI endpoint base
    const targetUrl = `https://api.chess.com/${chessPath}${searchParams ? '?' + searchParams : ''}`;
    
    const fetchOptions: RequestInit = {
      headers: {
        // Chess.com requires a valid User-Agent, otherwise they return 403.
        'User-Agent': 'SacThatRook chess analytics client (https://github.com/zenoguy/chess)',
        'Accept': 'application/json',
      }
    };

    if (bypassCache) {
      // Force next.js fetch to bypass server cache
      fetchOptions.cache = 'no-store';
    } else {
      // Edge cache for 5 minutes in Next.js
      (fetchOptions as any).next = {
        revalidate: 300,
      };
    }

    const response = await fetch(targetUrl, fetchOptions);

    if (!response.ok) {
      // Forward the error status
      const errText = await response.text().catch(() => 'Error fetching from Chess.com');
      return new NextResponse(errText, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        // HTTP caching for the browser: no cache if bypassed, else 5 minutes
        'Cache-Control': bypassCache
          ? 'no-store, no-cache, must-revalidate, proxy-revalidate'
          : 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error: any) {
    console.error('Chess API Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
