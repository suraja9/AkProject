import { useState, useRef, useEffect } from "react";

const InfoIcon = ({ size = 13, color = "#C9A84C", opacity = 0.6 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" stroke={color} strokeOpacity={opacity}/>
    <path d="M7 6v4M7 4.5v.5" stroke={color} strokeOpacity={0.8} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <path d="M2 4l4 4 4-4" stroke="#C9A84C" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RateTooltip = ({ visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
      width: 280, background: "#0d1120", border: "1px solid #C9A84C33",
      borderRadius: 8, padding: "12px 14px", zIndex: 100,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "#C9A84C", fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        How to find your rate
      </div>
      {[
        { num: "1", title: "Pipeline method", desc: "Look at deals waiting on a feature. How many didn't close or churned? That ratio is your rate." },
        { num: "2", title: "Past launch method", desc: "Pick a late feature. Compare month-1 revenue vs projection. Gap ÷ projected = monthly loss rate ÷ 4 = weekly." },
        { num: "3", title: "Competitive pressure", desc: "High competition → 30–40%   Moderate → 20–25%   Low / unique → 10–15%" },
      ].map((item) => (
        <div key={item.num} style={{ marginBottom: 8, display: "flex", gap: 8 }}>
          <div style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", background: "#C9A84C22", border: "1px solid #C9A84C44", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#C9A84C", marginTop: 1 }}>
            {item.num}
          </div>
          <div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "#c8d0e0", fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "#5a6888", lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        </div>
      ))}
      {/* Arrow */}
      <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 8, height: 8, background: "#0d1120", borderRight: "1px solid #C9A84C33", borderBottom: "1px solid #C9A84C33" }} />
    </div>
  );
};

const fmt = (n) =>
  n === 0 ? "$0" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function DelayTax() {
  const [featureRate, setFeatureRate] = useState("25");
  const [showRateTooltip, setShowRateTooltip] = useState(false);
  const [expanded, setExpanded] = useState({});
  const tooltipRef = useRef(null);

  const [vals, setVals] = useState({
    product: { arr: "", months: "" },
    feature: { mrr: "", weeks: "" },
    deals: { count: "", value: "", rate: "" },
    churn: { customers: "", mrr: "" },
  });

  const set = (section, key, val) =>
    setVals((prev) => ({ ...prev, [section]: { ...prev[section], [key]: val } }));

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Close tooltip on outside click
  useEffect(() => {
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowRateTooltip(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const productVal = (parseFloat(vals.product.arr) || 0) * (parseFloat(vals.product.months) || 0) / 12;
  const featureVal = (parseFloat(vals.feature.mrr) || 0) * (parseFloat(vals.feature.weeks) || 0) * ((parseFloat(featureRate) || 25) / 100);
  const dealsVal = (parseFloat(vals.deals.count) || 0) * (parseFloat(vals.deals.value) || 0) * ((parseFloat(vals.deals.rate) || 0) / 100);
  const churnVal = (parseFloat(vals.churn.customers) || 0) * (parseFloat(vals.churn.mrr) || 0) * 12;

  const rows = [
    {
      id: "product",
      label: "Product launches that shipped late",
      formula: "Expected Year 1 ARR × months delayed ÷ 12",
      hint: "Use this for entirely new products entering the market. Delay here means a competitor can take that ground instead of you.",
      exampleLine: "e.g. $200,000 ARR × 3 months ÷ 12 = $50,000",
      value: productVal,
      inputs: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <InputCol label="Expected Year 1 ARR" prefix="$" val={vals.product.arr} onChange={(v) => set("product", "arr", v)} />
          <InputCol label="Months delayed" prefix="#" val={vals.product.months} onChange={(v) => set("product", "months", v)} />
        </div>
      ),
    },
    {
      id: "feature",
      label: "Feature launches that shipped late",
      formula: `Expected MRR uplift × weeks delayed × ${parseFloat(featureRate) || 25}%`,
      hint: "Use this for features that drive upsell, reduce churn, or unlock new usage within your existing customer base.",
      exampleLine: `e.g. $5,000 MRR uplift × 3 weeks × ${parseFloat(featureRate) || 25}% = ${fmt((5000 * 3 * (parseFloat(featureRate) || 25)) / 100)}`,
      value: featureVal,
      inputs: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <InputCol label="Expected MRR uplift" prefix="$" val={vals.feature.mrr} onChange={(v) => set("feature", "mrr", v)} />
          <InputCol label="Weeks delayed" prefix="#" val={vals.feature.weeks} onChange={(v) => set("feature", "weeks", v)} />
          {/* Rate field with tooltip */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "#4a5878", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Weekly delay rate
              </span>
              <div ref={tooltipRef} style={{ position: "relative", lineHeight: 1 }}>
                <button
                  onClick={() => setShowRateTooltip((v) => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                >
                  <InfoIcon size={13} color="#C9A84C" opacity={showRateTooltip ? 1 : 0.6} />
                </button>
                <RateTooltip visible={showRateTooltip} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", background: "#0e1117", border: `1px solid ${showRateTooltip ? "#C9A84C66" : "#252e42"}`, borderRadius: 6, overflow: "hidden", transition: "border-color 0.15s" }}>
              <span style={{ padding: "0 10px", color: "#C9A84C", fontSize: 12, fontWeight: 600, borderRight: "1px solid #252e42", height: 36, display: "flex", alignItems: "center", fontFamily: "'IBM Plex Mono', monospace", minWidth: 34, justifyContent: "center" }}>%</span>
              <input
                type="number" min="1" max="100"
                value={featureRate}
                onChange={(e) => setFeatureRate(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, padding: "0 10px", height: 36, width: "100%" }}
              />
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "#3a4868" }}>Default: 25%</div>
          </div>
        </div>
      ),
    },
    {
      id: "deals",
      label: "Deals that stalled waiting for your approval",
      formula: "No. of deals × avg deal value × close rate %",
      hint: "Your close rate is the % of qualified deals you typically win. Default to 50% if unsure.",
      exampleLine: "e.g. 3 deals × $10,000 × 60% = $18,000",
      value: dealsVal,
      inputs: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <InputCol label="No. of stalled deals" prefix="#" val={vals.deals.count} onChange={(v) => set("deals", "count", v)} />
          <InputCol label="Average deal value" prefix="$" val={vals.deals.value} onChange={(v) => set("deals", "value", v)} />
          <InputCol label="Close rate" prefix="%" val={vals.deals.rate} onChange={(v) => set("deals", "rate", v)} />
        </div>
      ),
    },
    {
      id: "churn",
      label: "Customers who churned while waiting for resolution",
      formula: "No. of churned customers × avg MRR per customer × 12",
      hint: "Multiplying by 12 converts monthly churn into annual revenue loss — the real cost of slow resolution.",
      exampleLine: "e.g. 2 customers × $800 × 12 = $19,200",
      value: churnVal,
      inputs: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <InputCol label="No. of churned customers" prefix="#" val={vals.churn.customers} onChange={(v) => set("churn", "customers", v)} />
          <InputCol label="Avg MRR per customer" prefix="$" val={vals.churn.mrr} onChange={(v) => set("churn", "mrr", v)} />
        </div>
      ),
    },
  ];

  const total = productVal + featureVal + dealsVal + churnVal;
  const annual = total * 12;

  return (
    <div style={{ minHeight: "100vh", background: "#0e1117", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .field-row { background: #151a24; border: 1px solid #1e2535; border-radius: 8px; padding: 16px 18px; margin-bottom: 10px; transition: border-color 0.2s; }
        .field-row:hover { border-color: #2a3348; }
        .result-pill { flex-shrink: 0; background: #0e1117; border: 1px solid #2a3348; border-radius: 6px; padding: 6px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; color: #555e78; white-space: nowrap; min-width: 90px; text-align: right; transition: all 0.2s; }
        .result-pill.active { border-color: #C9A84C55; background: #1a1200; color: #C9A84C; }
        .formula-toggle { display: flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 0; margin-top: 12px; color: #C9A84C; font-family: 'IBM Plex Mono', monospace; font-size: 11px; opacity: 0.55; transition: opacity 0.15s; }
        .formula-toggle:hover { opacity: 1; }
        .formula-box { margin-top: 8px; background: #0a0e17; border: 1px solid #1e2535; border-left: 2px solid #C9A84C55; border-radius: 6px; padding: 10px 12px; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 13px 18px; border-radius: 8px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 660 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#0e1117" }}>B</div>
          <h2 style={{ margin: 0, color: "#e8edf5", fontSize: 20, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>The Delay Tax</h2>
        </div>
        <p style={{ color: "#6a7898", fontSize: 13.5, lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 24, marginTop: 8 }}>
          Your time cost is just part of the picture. When decisions wait on you, revenue gets delayed or lost entirely. Estimate the impact over the last 1–4 weeks:
        </p>

        <div style={{ background: "#111622", border: "1px solid #1a2030", borderRadius: 10, padding: 16 }}>
          {rows.map((row) => (
            <div key={row.id} className="field-row">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#c8d0e0", fontWeight: 500, lineHeight: 1.4 }}>{row.label}</div>
                <div className={`result-pill${row.value > 0 ? " active" : ""}`}>{row.value > 0 ? fmt(row.value) : "—"}</div>
              </div>

              {row.inputs}

              <button className="formula-toggle" onClick={() => toggle(row.id)}>
                <InfoIcon />
                How this is calculated
                <ChevronIcon open={expanded[row.id]} />
              </button>

              {expanded[row.id] && (
                <div className="formula-box">
                  <div style={{ color: "#C9A84C", fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>⟨ {row.formula} ⟩</div>
                  <div style={{ color: "#3a4868", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 5 }}>{row.exampleLine}</div>
                  <div style={{ color: "#4a5878", fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5 }}>{row.hint}</div>
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: "#1a2030", margin: "14px 0" }} />

          <div className="total-row" style={{ background: "#1a2030" }}>
            <span style={{ color: "#c8d0e0", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, fontWeight: 600 }}>Total Delay Tax (last 30 days)</span>
            <span style={{ color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600 }}>{fmt(total)}</span>
          </div>
          <div className="total-row" style={{ background: "#1a1000", border: "1px solid #C9A84C22", marginTop: 8 }}>
            <span style={{ color: "#c8a060", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13.5, fontWeight: 600 }}>Multiply by 12 for annual impact</span>
            <span style={{ color: "#C9A84C", fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700 }}>{fmt(annual)}/yr</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputCol({ label, prefix, val, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "#4a5878", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", background: "#0e1117", border: "1px solid #252e42", borderRadius: 6, overflow: "hidden", transition: "border-color 0.15s" }}
        onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C66"}
        onBlur={(e) => e.currentTarget.style.borderColor = "#252e42"}
      >
        <span style={{ padding: "0 10px", color: "#C9A84C", fontSize: 12, fontWeight: 600, borderRight: "1px solid #252e42", height: 36, display: "flex", alignItems: "center", fontFamily: "'IBM Plex Mono', monospace", minWidth: 34, justifyContent: "center" }}>{prefix}</span>
        <input
          type="number" min="0" placeholder="0"
          value={val}
          onChange={(e) => onChange(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", color: "#e8edf5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, padding: "0 10px", height: 36, width: "100%" }}
        />
      </div>
    </div>
  );
}
