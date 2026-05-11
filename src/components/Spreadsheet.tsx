import React, { useState, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Document } from '../types';

const ROWS = 1000;
const COLS = 26;
const COL_NAMES = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

export default function Spreadsheet({ doc, onBack, onSave }: { doc: Document, onBack: () => void, onSave: (data: any) => void }) {
  const [cells, setCells] = useState(doc.data || {});
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => onSave(cells), 500);
    return () => clearTimeout(timer);
  }, [cells]);

  const handleChange = (id: string, val: string) => {
    setCells((prev: any) => ({
      ...prev,
      [id]: { raw: val, value: val.startsWith('=') ? "CALC..." : val }
    }));
  };

  const Row = useCallback(({ index, style }: any) => (
    <div style={{ ...style, display: 'flex' }}>
      <div className="row-num">{index + 1}</div>
      {COL_NAMES.map(col => {
        const id = `${col}${index + 1}`;
        return (
          <div key={id} className={`cell-unit ${active === id ? 'active' : ''}`}>
            <input
              value={active === id ? (cells[id]?.raw || '') : (cells[id]?.value || '')}
              onChange={(e) => handleChange(id, e.target.value)}
              onFocus={() => setActive(id)}
            />
          </div>
        );
      })}
    </div>
  ), [cells, active]);

  return (
    <div className="st-wrapper">
      <div className="toolbar">
        <button onClick={onBack}>← Назад</button>
        <b style={{ marginLeft: '15px' }}>{doc.title}</b>
      </div>
      <div className="f-bar">
        <div className="f-id">{active || ''}</div>
        <input 
          value={active ? (cells[active]?.raw || '') : ''} 
          onChange={(e) => active && handleChange(active, e.target.value)}
        />
      </div>
      <List height={500} itemCount={ROWS} itemSize={30} width={COLS * 100 + 40}>
        {Row}
      </List>
    </div>
  );
}