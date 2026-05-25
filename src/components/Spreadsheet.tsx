import { useEffect, useState } from 'react';
import type { Document, SpreadsheetData } from '../types';
import { makeCell } from '../cells';

const ROWS = 40;
const COLS = 10;
const COL_NAMES = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

interface SpreadsheetProps {
  doc: Document;
  onBack: () => void;
  onSave: (data: SpreadsheetData) => void;
}

export default function Spreadsheet({ doc, onBack, onSave }: SpreadsheetProps) {
  const [cells, setCells] = useState<SpreadsheetData>(doc.data);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => onSave(cells), 500);
    return () => clearTimeout(timer);
  }, [cells, onSave]);

  const handleChange = (id: string, val: string) => {
    setCells(prev => ({
      ...prev,
      [id]: makeCell(val),
    }));
  };

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
      <div className="sheet">
        <div className="grid-h">
          <div className="corner-cell" />
          {COL_NAMES.map(col => <div key={col} className="col-h">{col}</div>)}
        </div>
        {Array.from({ length: ROWS }, (_, rowIndex) => (
          <div className="sheet-row" key={rowIndex}>
            <div className="row-num">{rowIndex + 1}</div>
            {COL_NAMES.map(col => {
              const id = `${col}${rowIndex + 1}`;
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
        ))}
      </div>
    </div>
  );
}
