// next-ambient.d.ts
// Ambient shim for next/* imports — Next.js 16 generation is supposed to
// provide these via ".next/dev/types/routes.d.ts" (referenced from next-env.d.ts),
// but plain tsc without `next build` runtime misses them.
// Minimal stubs to unblock `tsc --noEmit` checks.

declare module "next" {
  export type Metadata = Record<string, any>
  export type Viewport = Record<string, any>
}

declare module "next/link" {
  import { ComponentType, AnchorHTMLAttributes, ReactNode } from "react"
  export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string | { pathname: string; query?: any }
    as?: string
    replace?: boolean
    scroll?: boolean
    prefetch?: boolean
    children?: ReactNode
    legacyBehavior?: boolean
    passHref?: boolean
    shallow?: boolean
    locale?: string | false
  }
  const Link: ComponentType<LinkProps>
  export default Link
}

declare module "next/navigation" {
  export function notFound(): never
  export function redirect(url: string, type?: "replace" | "push"): never
  export function usePathname(): string
  export function useSearchParams(): URLSearchParams | ReadonlyURLSearchParams
  export function useParams<T = Record<string, string>>(): T
  export function useRouter(): {
    push: (url: string) => void
    replace: (url: string) => void
    refresh: () => void
    back: () => void
    forward: () => void
    prefetch: (url: string) => void
  }
  export interface ReadonlyURLSearchParams {
    get(name: string): string | null
    has(name: string): boolean
    keys(): string[]
    values(): string[]
    entries(): [string, string][]
    toString(): string
  }
}

declare module "next/server" {
  export interface NextRequest {
    url: string
    method: string
    cookies: any
    headers: Headers
    json: () => Promise<any>
    nextUrl: { searchParams: URLSearchParams; pathname: string }
  }
  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit | { status?: number }): NextResponse
    static redirect(url: string, init?: number | ResponseInit): NextResponse
    static rewrite(destination: string | URL, init?: ResponseInit): NextResponse
    static next(init?: { status?: number; headers?: HeadersInit }): NextResponse
  }
}

declare module "next/font/google" {
  export function Geist(_opts?: any): { className: string; variable: string }
  export function Geist_Mono(_opts?: any): { className: string; variable: string }
}

declare module "next/og" {
  export class ImageResponse {
    constructor(element: any, init?: { width?: number; height?: number; fonts?: any[] })
  }
}

// `next/script`, `next/image`, etc. if needed later — add stubs on demand.
