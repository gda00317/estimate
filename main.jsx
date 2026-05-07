import { useState, useEffect } from "react";

const PRODUCTS = [
  "냉장고","김치냉장고","TV","스탠바이미","세탁기","건조기",
  "워시타워","워시콤보","스타일러","식기세척기","인덕션",
  "청소기","로봇청소기","공기청정기","정수기","에어컨","오븐","직접입력"
];

const DEFAULT_BENEFIT_ITEMS = [
  "캐시백","상품권","멤버십","특별혜택","제휴카드","선택 결제카드"
];

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
  .print-root { background: #fff !important; padding: 0 !important; }
  .print-table { width: 100% !important; box-shadow: none !important; }
  .print-table th, .print-table td { font-size: 11px !important; padding: 4px 7px !important; }
  .print-total-val { font-size: 18px !important; }
  .no-print-btn { display: none !important; }
}
`;

const DEFAULT_MEMO_ITEMS = [
  "1년 AS 무상",
  "6년 AS 무상",
  "12개월 주기 스팀케어(해당제품)",
  "12개월 주기 살균/클리닝(해당제품)",
  "36개월 주기 기계실 세척(해당제품)",
  "36개월 주기 부분분해세척(해당제품)",
  "36~48개월 사이 상판교체(해당제품)",
  "필터/소모품 주기별 교체(해당제품)",
];

const MAX_COLS = 5;

const fmt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(String(v).replace(/,/g, ""));
  if (isNaN(n)) return v;
  return n.toLocaleString("ko-KR");
};

const parse = (v) => {
  const n = Number(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

const emptyCol = () => ({
  products: [],
  정상가: "", 행사가: "", 결제금액: "",
  혜택항목: [], 최종혜택합계: "",
  선납금액: "", 선납캐시백: "",
  정상구독료: "", 프로모션할인: "", 결합할인: "", 체감구독료: "",
  혜택사항: [],  // string[] 로 변경
});

const calcTotal = (col) => {
  const 결제 = parse(col.결제금액);
  const 선납 = parse(col.선납금액);
  const 선납캐시백 = parse(col.선납캐시백);
  const 최종혜택 = parse(col.최종혜택합계);
  const 체감 = parse(col.체감구독료);
  return (결제 + 선납) - (최종혜택 + 선납캐시백) + (체감 * 72);
};

// ─── 팝업: 품목 다중 선택 ─────────────────────────────────────────
function ProductPopup({ selected, onConfirm, onClose }) {
  const [local, setLocal] = useState(selected.map(p => ({ ...p })));

  const toggle = (name) => {
    if (name === "직접입력") {
      setLocal(prev => [...prev, { name: "직접입력", customName: "" }]);
    } else {
      const exists = local.some(p => p.name === name);
      if (exists) {
        setLocal(prev => prev.filter(p => p.name !== name));
      } else {
        setLocal(prev => [...prev, { name, customName: "" }]);
      }
    }
  };

  const isSelected = (name) => name !== "직접입력" && local.some(p => p.name === name);
  const setCustom = (idx, val) =>
    setLocal(prev => prev.map((p, i) => i === idx ? { ...p, customName: val } : p));
  const removeTag = (idx) => setLocal(prev => prev.filter((_, i) => i !== idx));
  const directItems = local.map((p, i) => ({ ...p, _idx: i })).filter(p => p.name === "직접입력");

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.popup, minWidth: 300 }} onClick={e => e.stopPropagation()}>
        <div style={styles.popupTitle}>
          품목 선택
          <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 6 }}>여러 개 선택 가능</span>
        </div>
        <div style={styles.popupGrid}>
          {PRODUCTS.map(p => (
            <button
              key={p}
              style={{
                ...styles.popupItem,
                ...(isSelected(p) ? styles.popupItemActive : {}),
                ...(p === "직접입력" ? { borderStyle: "dashed", color: "#555" } : {})
              }}
              onClick={() => toggle(p)}
            >
              {isSelected(p) && <span style={{ marginRight: 2 }}>✓ </span>}
              {p === "직접입력" ? "+ 직접입력" : p}
            </button>
          ))}
        </div>
        {directItems.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>직접입력 항목 ({directItems.length}개)</div>
            {directItems.map((p) => (
              <div key={p._idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  style={{ ...styles.addInput, flex: 1, margin: 0 }}
                  placeholder="내용 입력"
                  value={p.customName}
                  onChange={e => setCustom(p._idx, e.target.value)}
                />
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, lineHeight: 1, padding: "0 2px" }}
                  onClick={() => removeTag(p._idx)}>×</button>
              </div>
            ))}
          </div>
        )}
        {local.filter(p => p.name !== "직접입력").length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {local.map((p, i) => p.name === "직접입력" ? null : (
              <span key={i} style={styles.selectedTag}>
                {p.name}
                <button style={styles.tagRemove} onClick={() => removeTag(i)}>×</button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={{ ...styles.popupClose, background: "#888", flex: 1 }} onClick={onClose}>취소</button>
          <button style={{ ...styles.popupClose, flex: 2 }} onClick={() => onConfirm(local)}>
            확인 {local.length > 0 ? `(${local.length}개)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 팝업: 혜택 항목 선택 ─────────────────────────────────────────
function BenefitPopup({ savedItems, onAdd, onClose, onSaveItems }) {
  const [items, setItems] = useState([...savedItems]);
  const [newItem, setNewItem] = useState("");

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.popup, minWidth: 320 }} onClick={e => e.stopPropagation()}>
        <div style={styles.popupTitle}>혜택 항목 선택</div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>클릭 → 추가 &nbsp;·&nbsp; 우클릭 → 삭제</div>
        <div style={styles.popupGrid}>
          {items.map((it, i) => (
            <button key={i} style={styles.popupItem}
              onClick={() => onAdd(it)}
              onContextMenu={e => {
                e.preventDefault();
                const u = items.filter((_, j) => j !== i);
                setItems(u); onSaveItems(u);
              }}>{it}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <input style={styles.addInput} placeholder="새 항목 추가 후 Enter"
            value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newItem.trim()) {
                const u = [...items, newItem.trim()];
                setItems(u); onSaveItems(u); setNewItem("");
              }
            }} />
          <button style={styles.addBtn} onClick={() => {
            if (!newItem.trim()) return;
            const u = [...items, newItem.trim()];
            setItems(u); onSaveItems(u); setNewItem("");
          }}>+</button>
        </div>
        <button style={styles.popupClose} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

// ─── 팝업: 혜택사항 선택 (품목처럼) ──────────────────────────────
function MemoPopup({ selected, savedItems, onConfirm, onClose, onSaveItems }) {
  const [local, setLocal] = useState([...selected]);
  const [items, setItems] = useState([...savedItems]);
  const [editing, setEditing] = useState(null); // { idx, val } - 항목 수정
  const [newItem, setNewItem] = useState("");

  const toggle = (item) => {
    if (local.includes(item)) {
      setLocal(prev => prev.filter(x => x !== item));
    } else {
      setLocal(prev => [...prev, item]);
    }
  };

  const saveEdit = (i, val) => {
    if (!val.trim()) return;
    const updItems = items.map((it, j) => j === i ? val.trim() : it);
    // local에서도 같이 업데이트
    const updLocal = local.map(x => x === items[i] ? val.trim() : x);
    setItems(updItems);
    onSaveItems(updItems);
    setLocal(updLocal);
    setEditing(null);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.popup, minWidth: 340, maxWidth: "94vw" }} onClick={e => e.stopPropagation()}>
        <div style={styles.popupTitle}>
          혜택사항 선택
          <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginLeft: 6 }}>여러 개 선택 가능</span>
        </div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>클릭 → 선택/해제 &nbsp;·&nbsp; ✎ → 수정 &nbsp;·&nbsp; 우클릭 → 삭제</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {editing && editing.idx === i ? (
                <>
                  <input
                    autoFocus
                    style={{ ...styles.addInput, flex: 1, margin: 0 }}
                    value={editing.val}
                    onChange={e => setEditing({ ...editing, val: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === "Enter") saveEdit(i, editing.val);
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                  <button style={styles.memoEditSave} onClick={() => saveEdit(i, editing.val)}>저장</button>
                  <button style={styles.memoEditCancel} onClick={() => setEditing(null)}>취소</button>
                </>
              ) : (
                <>
                  <button
                    style={{
                      ...styles.memoSelectBtn,
                      ...(local.includes(it) ? styles.memoSelectBtnActive : {})
                    }}
                    onClick={() => toggle(it)}
                    onContextMenu={e => {
                      e.preventDefault();
                      const updItems = items.filter((_, j) => j !== i);
                      const updLocal = local.filter(x => x !== it);
                      setItems(updItems);
                      onSaveItems(updItems);
                      setLocal(updLocal);
                    }}
                  >
                    <span style={{ marginRight: 8, fontSize: 13, opacity: local.includes(it) ? 1 : 0.3 }}>✓</span>
                    {it}
                  </button>
                  <button style={styles.memoEditBtn} onClick={() => setEditing({ idx: i, val: it })}>✎</button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 새 항목 추가 */}
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <input
            style={styles.addInput}
            placeholder="새 혜택사항 추가 후 Enter"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newItem.trim()) {
                const u = [...items, newItem.trim()];
                setItems(u); onSaveItems(u); setNewItem("");
              }
            }}
          />
          <button style={styles.addBtn} onClick={() => {
            if (!newItem.trim()) return;
            const u = [...items, newItem.trim()];
            setItems(u); onSaveItems(u); setNewItem("");
          }}>+</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={{ ...styles.popupClose, background: "#888", flex: 1 }} onClick={onClose}>취소</button>
          <button style={{ ...styles.popupClose, flex: 2 }} onClick={() => onConfirm(local)}>
            확인 {local.length > 0 ? `(${local.length}개)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 숫자 입력 셀 ─────────────────────────────────────────────────
function NumCell({ value, onChange, highlight, sub, bold }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const baseStyle = {
    ...styles.cell,
    ...(highlight ? styles.cellHighlight : {}),
    ...(sub ? styles.cellSub : {}),
    ...(bold ? { fontWeight: 700 } : {}),
  };
  if (editing) return (
    <td style={baseStyle}>
      <input autoFocus style={styles.cellInput} value={raw}
        onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => { onChange(raw); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(raw); setEditing(false); } }} />
    </td>
  );
  return (
    <td style={baseStyle} onClick={() => { setRaw(String(value || "")); setEditing(true); }}>
      {value ? fmt(value) : <span style={{ color: "#ddd" }}>-</span>}
    </td>
  );
}

function BenefitAmountCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  if (editing) return (
    <input autoFocus style={{ ...styles.cellInput, width: 72, fontSize: 11 }} value={raw}
      onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={() => { onChange(raw); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onChange(raw); setEditing(false); } }} />
  );
  return (
    <span style={{ cursor: "pointer", color: value ? "#222" : "#bbb", fontSize: 11, minWidth: 64, textAlign: "right", display: "inline-block" }}
      onClick={() => { setRaw(String(value || "")); setEditing(true); }}>
      {value ? fmt(value) : "입력"}
    </span>
  );
}

function TotalCell({ total, hasData }) {
  const [hovered, setHovered] = useState(false);
  return (
    <td style={styles.totalCell} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ ...styles.totalFormula, opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }}>
        (결제+선납) − (최종혜택합계+선납캐시백) + (체감×72)
      </div>
      <div style={styles.totalValue} className="print-total-val">
        {hasData ? fmt(total) : "—"}
        {hasData && <span style={styles.totalWon}>원</span>}
      </div>
    </td>
  );
}

function SectionDivider({ label, colCount }) {
  return (
    <tr>
      <td colSpan={1 + colCount} style={{
        background: "#efefef", padding: "3px 10px", fontSize: 10,
        fontWeight: 700, color: "#999", letterSpacing: 1, borderTop: "2px solid #e0e0e0",
      }}>{label.toUpperCase()}</td>
    </tr>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────
export default function App() {
  const [cols, setCols] = useState([emptyCol(), emptyCol(), emptyCol()]);
  const [productPopup, setProductPopup] = useState(null);
  const [benefitPopup, setBenefitPopup] = useState(null);
  const [memoPopup, setMemoPopup] = useState(null);
  const [benefitItems, setBenefitItems] = useState([...DEFAULT_BENEFIT_ITEMS]);
  const [memoItems, setMemoItems] = useState([...DEFAULT_MEMO_ITEMS]);

  const setField = (ci, field, val) =>
    setCols(prev => prev.map((c, i) => i === ci ? { ...c, [field]: val } : c));

  const addCol = () => { if (cols.length < MAX_COLS) setCols(prev => [...prev, emptyCol()]); };
  const removeCol = (ci) => { if (cols.length > 1) setCols(prev => prev.filter((_, i) => i !== ci)); };
  const copyCol = (ci) => {
    if (cols.length >= MAX_COLS) return;
    const src = cols[ci];
    const copied = {
      ...src,
      products: src.products.map(p => ({ ...p })),
      혜택항목: src.혜택항목.map(b => ({ ...b })),
      혜택사항: [...src.혜택사항],
    };
    setCols(prev => [...prev, copied]);
  };

  const addBenefitToCol = (ci, name) => {
    setCols(prev => prev.map((c, i) =>
      i !== ci ? c : { ...c, 혜택항목: [...c.혜택항목, { name, amount: "" }] }
    ));
    setBenefitPopup(null);
  };

  const setBenefitAmount = (ci, bi, val) =>
    setCols(prev => prev.map((c, i) =>
      i !== ci ? c : { ...c, 혜택항목: c.혜택항목.map((b, j) => j === bi ? { ...b, amount: val } : b) }
    ));

  const removeBenefit = (ci, bi) =>
    setCols(prev => prev.map((c, i) =>
      i !== ci ? c : { ...c, 혜택항목: c.혜택항목.filter((_, j) => j !== bi) }
    ));

  const colCount = cols.length;

  // 인쇄 CSS 주입
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-styles";
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("print-styles"); if (el) el.remove(); };
  }, []);

  const handlePrint = () => window.print();

  return (
    <div style={styles.root} className="print-root">
      <div style={styles.header}>
        <span style={styles.headerTitle}>견적 비교표</span>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          <button style={styles.addColBtn} onClick={addCol} disabled={cols.length >= MAX_COLS}>+ 견적 추가</button>
          <button style={styles.printBtn} onClick={handlePrint}>🖨 인쇄</button>
        </div>
      </div>

      <div style={styles.tableWrap} className="print-table-wrap">
        <table style={{ ...styles.table, tableLayout: "fixed" }} className="print-table">
          <colgroup>
            <col style={{ width: "110px" }} />
            {cols.map((_, i) => <col key={i} style={{ width: `${90 / cols.length}%` }} />)}
          </colgroup>

          <thead>
            <tr>
              <th style={styles.thLabel}>구분</th>
              {cols.map((col, ci) => (
                <th key={ci} style={styles.th}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={styles.colNum}>{ci + 1}안</span>
                    <div style={{ display: "flex", gap: 4 }} className="no-print">
                      {cols.length < MAX_COLS && (
                        <button style={styles.copyColBtn} onClick={() => copyCol(ci)} title="이 견적 복사">⧉</button>
                      )}
                      {cols.length > 1 && (
                        <button style={styles.delColBtn} onClick={() => removeCol(ci)}>×</button>
                      )}
                    </div>
                  </div>
                  {col.products.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                      {col.products.map((p, pi) => (
                        <span key={pi} style={styles.productTag}>
                          {p.name === "직접입력" ? (p.customName || "직접입력") : p.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <button style={styles.productBtn} onClick={() => setProductPopup(ci)} className="no-print">
                    {col.products.length > 0 ? `✎ 품목 수정 (${col.products.length}개)` : "＋ 품목 선택"}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <SectionDivider label="기본 가격" colCount={colCount} />
            <tr>
              <td style={styles.labelCell}>정상가</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.정상가} onChange={v => setField(ci, "정상가", v)} />)}
            </tr>
            <tr>
              <td style={styles.labelCell}>행사가</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.행사가} onChange={v => setField(ci, "행사가", v)} />)}
            </tr>
            <tr>
              <td style={{ ...styles.labelCell, ...styles.mainLabel }}>결제금액</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.결제금액} onChange={v => setField(ci, "결제금액", v)} highlight bold />)}
            </tr>

            <SectionDivider label="혜택" colCount={colCount} />

            {Array.from({ length: Math.max(...cols.map(c => c.혜택항목.length), 0) }, (_, bi) => (
              <tr key={`b${bi}`}>
                <td style={{ ...styles.labelCell, ...styles.subLabel }}>
                  {cols.map(c => c.혜택항목[bi]?.name).find(Boolean) || "혜택"}
                </td>
                {cols.map((col, ci) => {
                  const b = col.혜택항목[bi];
                  if (!b) return <td key={ci} style={{ ...styles.cell, ...styles.cellSub }} />;
                  return (
                    <td key={ci} style={{ ...styles.cell, ...styles.cellSub }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ flex: 1, fontSize: 10, color: "#999" }}>{b.name}</span>
                        <BenefitAmountCell value={b.amount} onChange={v => setBenefitAmount(ci, bi, v)} />
                        <button style={styles.removeBtn} onClick={() => removeBenefit(ci, bi)}>×</button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <td style={{ ...styles.labelCell, ...styles.subLabel }} className="no-print">+ 혜택 추가</td>
              {cols.map((col, ci) => (
                <td key={ci} style={{ ...styles.cell, ...styles.cellSub }}>
                  <button style={styles.addBenefitBtn} onClick={() => setBenefitPopup(ci)}>+ 추가</button>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ ...styles.labelCell, ...styles.subMainLabel }}>혜택합계</td>
              {cols.map((col, ci) => {
                const sum = col.혜택항목.reduce((s, b) => s + parse(b.amount), 0);
                return (
                  <td key={ci} style={{ ...styles.cell, ...styles.cellSubMain }}>
                    {sum > 0 ? fmt(sum) : <span style={{ color: "#ccc" }}>-</span>}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td style={{ ...styles.labelCell, ...styles.mainLabel }}>최종혜택합계</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.최종혜택합계} onChange={v => setField(ci, "최종혜택합계", v)} highlight bold />)}
            </tr>

            <SectionDivider label="선납" colCount={colCount} />
            <tr>
              <td style={{ ...styles.labelCell, ...styles.mainLabel }}>선납금액</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.선납금액} onChange={v => setField(ci, "선납금액", v)} highlight bold />)}
            </tr>
            <tr>
              <td style={{ ...styles.labelCell, ...styles.subLabel }}>선납캐시백</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.선납캐시백} onChange={v => setField(ci, "선납캐시백", v)} sub />)}
            </tr>

            <SectionDivider label="구독료" colCount={colCount} />
            <tr>
              <td style={styles.labelCell}>정상구독료</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.정상구독료} onChange={v => setField(ci, "정상구독료", v)} />)}
            </tr>
            <tr>
              <td style={styles.labelCell}>프로모션할인</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.프로모션할인} onChange={v => setField(ci, "프로모션할인", v)} />)}
            </tr>
            <tr>
              <td style={styles.labelCell}>결합할인</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.결합할인} onChange={v => setField(ci, "결합할인", v)} />)}
            </tr>
            <tr>
              <td style={{ ...styles.labelCell, ...styles.mainLabel }}>체감구독료(월)</td>
              {cols.map((col, ci) => <NumCell key={ci} value={col.체감구독료} onChange={v => setField(ci, "체감구독료", v)} highlight bold />)}
            </tr>

            {/* 합산가 */}
            <tr><td colSpan={1 + colCount} style={{ height: 8, background: "#111" }} /></tr>
            <tr>
              <td style={styles.totalLabel}>합산가</td>
              {cols.map((col, ci) => {
                const total = calcTotal(col);
                const hasData = parse(col.결제금액) > 0 || parse(col.선납금액) > 0;
                return <TotalCell key={ci} total={total} hasData={hasData} />;
              })}
            </tr>

            {/* 혜택사항 */}
            <tr><td colSpan={1 + colCount} style={{ height: 6, background: "#1a1a1a" }} /></tr>
            <tr>
              <td style={{ ...styles.benefitNoteLabel, verticalAlign: cols.every(c => c.혜택사항.length === 0) ? "middle" : "top" }}>혜택사항</td>
              {cols.map((col, ci) => (
                <td key={ci} style={{ ...styles.benefitNoteCell, padding: col.혜택사항.length > 0 ? "10px 12px" : "6px 12px" }}>
                  {/* 선택된 항목 태그들 */}
                  {col.혜택사항.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                      {col.혜택사항.map((item, ii) => (
                        <div key={ii} style={styles.memoTag}>
                          <span style={{ fontSize: 11, color: "#22c55e", marginRight: 5 }}>✓</span>
                          <span style={{ flex: 1, fontSize: 12, color: "#e0e0e0", lineHeight: 1.4 }}>{item}</span>
                          <button
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: 13, padding: 0, lineHeight: 1 }}
                            onClick={() => setField(ci, "혜택사항", col.혜택사항.filter((_, j) => j !== ii))}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    style={styles.memoAddBtn}
                    onClick={() => setMemoPopup(ci)}
                    className="no-print"
                  >
                    {col.혜택사항.length > 0 ? `✎ 혜택사항 수정 (${col.혜택사항.length}개)` : "＋ 혜택사항 선택"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {productPopup !== null && (
        <ProductPopup
          selected={cols[productPopup]?.products || []}
          onConfirm={(products) => { setField(productPopup, "products", products); setProductPopup(null); }}
          onClose={() => setProductPopup(null)}
        />
      )}
      {benefitPopup !== null && (
        <BenefitPopup
          savedItems={benefitItems}
          onAdd={name => addBenefitToCol(benefitPopup, name)}
          onClose={() => setBenefitPopup(null)}
          onSaveItems={items => setBenefitItems(items)}
        />
      )}
      {memoPopup !== null && (
        <MemoPopup
          selected={cols[memoPopup]?.혜택사항 || []}
          savedItems={memoItems}
          onConfirm={(selected) => { setField(memoPopup, "혜택사항", selected); setMemoPopup(null); }}
          onClose={() => setMemoPopup(null)}
          onSaveItems={items => setMemoItems(items)}
        />
      )}
    </div>
  );
}

const styles = {
  root: { fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif", background: "#f4f4f4", minHeight: "100vh", paddingBottom: 40 },
  header: { background: "#1a1a1a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  headerTitle: { color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 1 },
  printBtn: { background: "#2d2d2d", color: "#fff", border: "1px solid #444", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  addColBtn: { background: "#c8102e", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tableWrap: { overflowX: "auto", padding: "0 12px", marginTop: 16 },
  table: { borderCollapse: "collapse", width: "100%", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" },
  thLabel: { background: "#1a1a1a", color: "#777", fontSize: 10, fontWeight: 700, padding: "12px 10px", letterSpacing: 1, textAlign: "left", borderRight: "1px solid #2a2a2a" },
  th: { background: "#1a1a1a", borderRight: "1px solid #2a2a2a", padding: "10px 10px", verticalAlign: "top" },
  colNum: { color: "#666", fontSize: 10, fontWeight: 700, letterSpacing: 1 },
  productTag: { background: "#2c2c2c", color: "#ddd", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 },
  productBtn: { background: "#222", border: "1px dashed #444", color: "#999", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "center" },
  copyColBtn: { background: "#2a2a2a", border: "1px solid #444", color: "#aaa", fontSize: 13, cursor: "pointer", lineHeight: 1, padding: "2px 5px", borderRadius: 4 },
  delColBtn: { background: "transparent", border: "none", color: "#555", fontSize: 15, cursor: "pointer", lineHeight: 1, padding: 0 },
  labelCell: { padding: "7px 10px", fontSize: 12, color: "#555", fontWeight: 500, borderRight: "1px solid #eee", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap", background: "#fafafa" },
  mainLabel: { color: "#1a1a1a", fontWeight: 800, fontSize: 13, background: "#ececec" },
  subMainLabel: { color: "#444", fontWeight: 700, fontSize: 11, background: "#fafafa", paddingLeft: 18 },
  subLabel: { fontSize: 11, color: "#999", paddingLeft: 18, background: "#fdfdfd" },
  cell: { padding: "7px 12px", fontSize: 13, color: "#1a1a1a", textAlign: "right", borderRight: "1px solid #eee", borderBottom: "1px solid #f0f0f0", cursor: "pointer", minWidth: 120 },
  cellHighlight: { background: "#fff8f0", fontWeight: 700, fontSize: 14, color: "#c8102e" },
  cellSub: { background: "#fdfdfd", fontSize: 11, color: "#666", padding: "5px 12px" },
  cellSubMain: { background: "#fafafa", fontSize: 12, fontWeight: 700, color: "#333" },
  cellInput: { border: "1.5px solid #c8102e", borderRadius: 4, padding: "2px 6px", fontSize: 13, width: "90%", outline: "none", textAlign: "right" },
  addBenefitBtn: { background: "transparent", border: "1px dashed #ccc", color: "#bbb", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" },
  removeBtn: { background: "transparent", border: "none", color: "#ddd", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 },
  totalLabel: { background: "#111", color: "#fff", fontWeight: 900, fontSize: 14, padding: "18px 12px", verticalAlign: "middle", borderRight: "1px solid #2a2a2a", letterSpacing: 1 },
  totalCell: { background: "#111", padding: "14px 16px", textAlign: "right", borderRight: "1px solid #222", verticalAlign: "middle" },
  totalFormula: { fontSize: 9, color: "#555", marginBottom: 5 },
  totalValue: { fontSize: 26, fontWeight: 900, color: "#c8102e", letterSpacing: -1 },
  totalWon: { fontSize: 13, fontWeight: 600, color: "#777", marginLeft: 3 },
  // 혜택사항
  benefitNoteLabel: { background: "#1a1a1a", color: "#888", fontWeight: 700, fontSize: 11, padding: "8px 10px", verticalAlign: "middle", borderRight: "1px solid #2a2a2a", letterSpacing: 0.5, whiteSpace: "nowrap" },
  benefitNoteCell: { background: "#1a1a1a", padding: "10px 12px", borderRight: "1px solid #2a2a2a", verticalAlign: "top" },
  memoTag: { display: "flex", alignItems: "flex-start", gap: 4, background: "#1e1e1e", borderRadius: 5, padding: "5px 8px", border: "1px solid #2a2a2a" },
  memoAddBtn: { background: "#222", border: "1px dashed #444", color: "#888", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", width: "100%", textAlign: "center" },
  // 팝업 공통
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" },
  popup: { background: "#fff", borderRadius: 14, padding: "22px 20px 16px", minWidth: 290, maxWidth: "92vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" },
  popupTitle: { fontWeight: 800, fontSize: 15, marginBottom: 14, color: "#1a1a1a" },
  popupGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 },
  popupItem: { background: "#f5f5f5", border: "1.5px solid #e8e8e8", borderRadius: 7, padding: "7px 4px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#333", textAlign: "center" },
  popupItemActive: { background: "#c8102e", borderColor: "#c8102e", color: "#fff" },
  popupClose: { marginTop: 14, width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 7, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  selectedTag: { background: "#f0f0f0", borderRadius: 20, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#333", display: "inline-flex", alignItems: "center", gap: 4 },
  tagRemove: { background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 12, padding: 0, lineHeight: 1 },
  addInput: { flex: 1, border: "1px solid #ddd", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" },
  addBtn: { background: "#c8102e", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  // 혜택사항 팝업 전용
  memoSelectBtn: { flex: 1, display: "flex", alignItems: "center", background: "#f7f7f7", border: "1.5px solid #e8e8e8", borderRadius: 7, padding: "8px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#444", textAlign: "left" },
  memoSelectBtnActive: { background: "#f0fdf4", borderColor: "#22c55e", color: "#166534", fontWeight: 700 },
  memoEditBtn: { background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#666", flexShrink: 0 },
  memoEditSave: { background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  memoEditCancel: { background: "#eee", color: "#666", border: "none", borderRadius: 5, padding: "5px 10px", fontSize: 11, cursor: "pointer", flexShrink: 0 },
};
