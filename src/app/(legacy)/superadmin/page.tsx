import ConsoleMovedNotice from "@/components/routing/ConsoleMovedNotice";

/** The old in-app console root: the console is now a separate site. */
export default function ConsoleMoved() {
    return <ConsoleMovedNotice consolePath="/dashboard" />;
}
