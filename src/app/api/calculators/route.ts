import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";
import { listCalcs, createCalc, createCalcFromTemplate, getCalc } from "@/lib/calcsStore";
import { CALC_TEMPLATES } from "@/data/calcTemplates";
import { getCalculator, putCalculator } from "@/lib/store";
import { calcFromMetaConfig, calcBlank } from "@/lib/calc-init";
import { clampForPlan, getPlanFromSession } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: lista (za Dashboard) */
export async function GET(req: Request) {
  try {
    const tmp = NextResponse.json({});
    const s = await getSessionOnRoute(req, tmp);
    if (!s.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const items = await listCalcs();
    return NextResponse.json(items, {
      status: 200,
      headers: tmp.headers.get("set-cookie") ? { "set-cookie": tmp.headers.get("set-cookie") as string } : {},
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

/** POST: kreiranje (blank / template / duplicate) — soft-auth + clamp po planu */
export async function POST(req: Request) {
  const tmp = NextResponse.json({});
  const s = await getSessionOnRoute(req, tmp).catch(() => null);
  const plan = getPlanFromSession(s);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      templateSlug?: string;
      from?: string;
    };

    const providedName = (body.name ?? "").trim();
    const tplKey = (body.templateSlug ?? "").trim();
    const fromKey = (body.from ?? "").trim();

    // 1) Duplicate (ako postoji izvor)
    if (fromKey) {
      const srcMini = await getCalc(fromKey);
      if (srcMini?.template) {
        const created = await createCalcFromTemplate(srcMini.template, providedName || `Copy of ${srcMini.meta.name}`);
        // upiši FULL, ali clamp-uj prema planu
        const full = clampForPlan(plan, calcFromMetaConfig(await getCalc(created.meta.slug)));
        await putCalculator(full);
        const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
        const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
        return res;
      } else if (srcMini) {
        const created = await createCalc(providedName || `Copy of ${srcMini.meta.name}`);
        const full = clampForPlan(plan, calcBlank(created.meta.slug, created.meta.name));
        await putCalculator(full);
        const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
        const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
        return res;
      }

      // ako ne postoji kalkulator sa tim slugom, tretiraj 'from' kao template
      const tplFromFrom = CALC_TEMPLATES.find(t => t.slug === fromKey);
      if (tplFromFrom) {
        const created = await createCalcFromTemplate(tplFromFrom.slug, providedName || tplFromFrom.defaultName || tplFromFrom.name);
        const full = clampForPlan(plan, calcFromMetaConfig(await getCalc(created.meta.slug)));
        await putCalculator(full);
        const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
        const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
        return res;
      }

      // fallback: prvi template
      const FALLBACK = CALC_TEMPLATES[0];
      if (FALLBACK) {
        const created = await createCalcFromTemplate(FALLBACK.slug, providedName || FALLBACK.defaultName || FALLBACK.name);
        const full = clampForPlan(plan, calcFromMetaConfig(await getCalc(created.meta.slug)));
        await putCalculator(full);
        const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
        const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
        return res;
      }

      // poslednje: blank
      const created = await createCalc(providedName || "Untitled Page");
      const full = clampForPlan(plan, calcBlank(created.meta.slug, created.meta.name));
      await putCalculator(full);
      const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
      const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
      return res;
    }

    // 2) Template create
    if (tplKey) {
      const tpl = CALC_TEMPLATES.find(t => t.slug === tplKey);
      if (!tpl) {
        return NextResponse.json(
          { error: "template_not_found", got: tplKey, valid: CALC_TEMPLATES.map(t => t.slug) },
          { status: 400 }
        );
      }
      const created = await createCalcFromTemplate(tpl.slug, providedName || tpl.defaultName || tpl.name);
      const full = clampForPlan(plan, calcFromMetaConfig(await getCalc(created.meta.slug)));
      await putCalculator(full);
      const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
      const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
      return res;
    }

    // 3) Blank
    const created = await createCalc(providedName || "Untitled Page");
    const full = clampForPlan(plan, calcBlank(created.meta.slug, created.meta.name));
    await putCalculator(full);
    const res = NextResponse.json({ ok: true, slug: created.meta.slug }, { status: 201 });
    const sc = tmp.headers.get("set-cookie"); if (sc) res.headers.set("set-cookie", sc);
    return res;

  } catch (e: any) {
    return NextResponse.json({ error: "bad_request", detail: String(e?.message ?? e) }, { status: 400 });
  }
}