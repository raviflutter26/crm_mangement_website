import ConsoleMovedNotice from "@/components/routing/ConsoleMovedNotice";
import { CONSOLE_MOVED } from "@/config/consoleMoved";

/**
 * Every old in-app console path: a notice that the console moved, linking to
 * the same screen on NEXT_PUBLIC_CONSOLE_URL. The one catch-all for this prefix.
 */
export const dynamicParams = false;
export function generateStaticParams() {
    return Object.keys(CONSOLE_MOVED).filter(Boolean).map(k => ({ slug: k.split("/") }));
}

export default async function ConsoleMoved({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params;
    return <ConsoleMovedNotice consolePath={CONSOLE_MOVED[slug.join("/")] ?? "/dashboard"} />;
}
