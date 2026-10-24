import { notFound } from "next/navigation";

// Unknown paths under a locale (e.g. /vi/abc) would otherwise fall through to
// Next's default 404, outside our layout and translations.
export default function CatchAll() {
  notFound();
}
