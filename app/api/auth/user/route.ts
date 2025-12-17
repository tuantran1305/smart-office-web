import axios from "axios";
import { config } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { token } = data;
    const resp = await axios.get(`https://${config.tbServer}/api/auth/user`, {
      headers: {
        "X-Authorization": `Bearer ${token}`,
      },
    });
    return NextResponse.json(resp.data);
  } catch (err: any) {
    if (err?.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status,
      });
    }
    console.error("/api/auth/user error", err);
    return NextResponse.json(
      { message: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
