import { NextResponse } from "next/server";

const toHttpUrl = (rawUrl: string) => rawUrl.replace(/^ws/, "http");

const getColyseusHttpUrls = () => {
  const candidates = [
    process.env.COLYSEUS_INTERNAL_URL,
    "ws://colyseus:2567",
    "ws://127.0.0.1:2567",
    "ws://localhost:2567",
    process.env.COLYSEUS_URL,
    process.env.NEXT_PUBLIC_COLYSEUS_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .map(toHttpUrl);

  return [...new Set(candidates)];
};

export async function GET() {
  const upstreamErrors: Array<{
    upstreamUrl: string;
    status?: number;
    statusText?: string;
    error?: string;
  }> = [];

  try {
    for (const baseUrl of getColyseusHttpUrls()) {
      const upstreamUrl = `${baseUrl}/rooms/public`;

      try {
        const response = await fetch(upstreamUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          upstreamErrors.push({
            upstreamUrl,
            status: response.status,
            statusText: response.statusText,
          });
          continue;
        }

        const data = await response.json();
        return NextResponse.json(data, {
          status: 200,
          headers: {
            "x-tricon-colyseus-upstream": upstreamUrl,
          },
        });
      } catch (error) {
        upstreamErrors.push({
          upstreamUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.error("Failed to load public rooms from every upstream", upstreamErrors);
    return NextResponse.json(
      { rooms: [], error: "failed_to_load_public_rooms" },
      {
        status: 502,
        headers: {
          "x-tricon-colyseus-attempts": String(upstreamErrors.length),
        },
      }
    );
  } catch (error) {
    console.error("Failed to proxy public rooms", {
      upstreamUrls: getColyseusHttpUrls().map((baseUrl) => `${baseUrl}/rooms/public`),
      upstreamErrors,
      error,
    });
    return NextResponse.json(
      { rooms: [], error: "failed_to_load_public_rooms" },
      { status: 500 }
    );
  }
}
