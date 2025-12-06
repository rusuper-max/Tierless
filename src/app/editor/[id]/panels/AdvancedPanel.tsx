// src/app/editor/[id]/panels/AdvancedPanel.tsx

import AdvancedPanelInner from "./advanced/AdvancedPanelInner";

type Props = {
  readOnly?: boolean;
};

export default function AdvancedPanel({ readOnly = false }: Props) {
  return <AdvancedPanelInner readOnly={readOnly} />;
}