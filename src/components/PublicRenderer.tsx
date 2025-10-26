import type { Calculator, Block } from "@/types/calculator";
import { RenderBlock } from "@/components/blocks/BlockRenderer";
import CopyLinkButton from "@/components/ui/CopyLinkButton";
import EditIfLoggedIn from "@/components/ui/EditIfLoggedIn";
import Button from "@/components/ui/Button";

function autoBlocksFrom(calc: Calculator): Block[] {
  const hasPackages = (calc.packages ?? []).length > 0;
  const hasItems    = (calc.items ?? []).length > 0;
  const hasFields   = (calc.fields ?? []).length > 0;
  const hasAddons   = (calc.addons ?? []).length > 0;

  const blocks: Block[] = [];
  const mode = calc.pricingMode ?? (hasItems ? "list" : "packages");

  if (mode === "packages" && hasPackages) {
    blocks.push({ id: "b_pkgs", type: "packages", title: "Plans", layout: "cards" });
  } else if (mode === "list") {
    blocks.push({ id: "b_items", type: "items", title: "Price list", showTotals: false });
  }
  if (hasFields) blocks.push({ id: "b_opts", type: "options", title: "Options" });
  if (hasAddons) blocks.push({ id: "b_extras", type: "extras", title: "Extras" });

  return blocks;
}

export default function PublicRenderer({ data }: { data: Calculator }) {
  const accent = data.meta.branding?.accent ?? "#7c3aed";
  const blocks = autoBlocksFrom(data);
  const publicUrl = `/p/${data.meta.slug}`;

  return (
    <div
      className="container-page space-y-8"
      style={{ ["--accent" as any]: accent }}
    >
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{data.meta.name}</h1>
          <div className="text-xs text-neutral-500">
            tierless — public page • /p/{data.meta.slug}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton href={publicUrl} className="btn" />
<EditIfLoggedIn slug={data.meta.slug} className="btn" />
<Button href={`mailto:?subject=Inquiry: ${encodeURIComponent(data.meta.name)}`}>
  Contact
</Button>
        </div>
      </header>

      <div className="space-y-6">
        {blocks.map((b) => (
          <RenderBlock key={b.id} calc={data} block={b} />
        ))}
        <footer>
          <a href="/" className="badge" aria-label="Made with Tierless">
            <span>Made with</span><strong>Tierless</strong>
          </a>
        </footer>
      </div>
    </div>
  );
}