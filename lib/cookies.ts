import { NextResponse } from "next/server";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  response.cookies.set("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60,
  });
  response.cookies.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}

export function jsonWithAuth(
  data: unknown,
  accessToken: string,
  refreshToken: string,
  status = 200,
): NextResponse {
  const response = NextResponse.json(data, { status });
  return setAuthCookies(response, accessToken, refreshToken);
}
