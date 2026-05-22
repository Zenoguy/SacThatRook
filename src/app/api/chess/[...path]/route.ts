import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const searchParams = new URL(request.url).searchParams.toString();
    const chessPath = path.join('/');
    
    // Chess.com PubAPI endpoint base
    const targetUrl = `https://api.chess.com/${chessPath}${searchParams ? '?' + searchParams : ''}`;
    
    const response = await fetch(targetUrl, {
      headers: {
        // Chess.com requires a valid User-Agent, otherwise they return 403.
        'User-Agent': 'SacThatRook chess analytics client (https://github.com/zenoguy/chess)',
        'Accept': 'application/json',
      },
      next: {
        revalidate: 300, // Edge cache for 5 minutes in Next.js
      }
    });

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
        // HTTP caching for the browser (5 minutes, stale-while-revalidate for 10 minutes)
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
