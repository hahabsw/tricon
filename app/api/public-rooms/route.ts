import { NextResponse } from "next/server";

const getColyseusHttpUrl = () => {
  const rawUrl =
    process.env.COLYSEUS_URL ??
    process.env.NEXT_PUBLIC_COLYSEUS_URL ??
    "ws://127.0.0.1:2567";

  return rawUrl.replace(/^ws/, "http");
};

export async function GET() {
  try {
    const response = await fetch(`${getColyseusHttpUrl()}/rooms/public`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { rooms: [], error: "failed_to_load_public_rooms" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Failed to proxy public rooms", error);
    return NextResponse.json(
      { rooms: [], error: "failed_to_load_public_rooms" },
      { status: 500 }
    );
  }
}
