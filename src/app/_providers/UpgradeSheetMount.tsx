"use client";

import UpgradeSheet from "@/components/upsell/UpgradeSheet";

export default function UpgradeSheetMount() {
  // Jednostavan globalni mount — nema propsa, samo sluša TL_UPSELL_OPEN
  return <UpgradeSheet />;
}