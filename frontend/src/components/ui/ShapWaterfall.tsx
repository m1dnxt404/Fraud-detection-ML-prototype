import { palette } from "../../constants";
import type { TransactionShap } from "../../types";

interface ShapWaterfallProps {
  shap: TransactionShap;
}

export function ShapWaterfall({ shap }: ShapWaterfallProps) {
  const maxAbsShap = Math.max(
    ...shap.features.map((f) => Math.abs(f.shapValue)),
    0.001,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] text-fd-text-dim font-mono mb-1">
        Base value:{" "}
        <span className="text-fd-text-muted">{shap.baseValue.toFixed(4)}</span>
      </div>

      {shap.features.map((f) => {
        const barPct = (Math.abs(f.shapValue) / maxAbsShap) * 42;
        const isPositive = f.shapValue >= 0;

        return (
          <div key={f.feature} className="flex items-center gap-2">
            <div className="w-32 text-[11px] text-fd-text-muted truncate text-right shrink-0">
              {f.feature}
            </div>
            <div className="w-16 text-[11px] font-mono text-fd-text-dim text-right shrink-0">
              {formatRaw(f.rawValue)}
            </div>
            <div className="flex-1 relative h-5 min-w-[120px]">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-fd-border" />
              {f.shapValue !== 0 && (
                <div
                  className="absolute top-0.5 h-4 rounded-sm"
                  style={{
                    ...(isPositive
                      ? { left: "50%", width: `${barPct}%` }
                      : { left: `${50 - barPct}%`, width: `${barPct}%` }),
                    backgroundColor: isPositive ? palette.accent : palette.blue,
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
            <div className="w-20 text-[11px] font-mono text-right shrink-0">
              <span className={isPositive ? "text-fd-accent" : "text-fd-blue"}>
                {isPositive ? "+" : ""}
                {f.shapValue.toFixed(4)}
              </span>
            </div>
          </div>
        );
      })}

      <div className="text-[11px] text-fd-text-dim font-mono mt-1">
        Output:{" "}
        <span className="text-fd-text font-semibold">
          {shap.outputValue.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

function formatRaw(val: number): string {
  if (Math.abs(val) >= 100) return val.toFixed(0);
  if (Math.abs(val) >= 1) return val.toFixed(1);
  return val.toFixed(2);
}
