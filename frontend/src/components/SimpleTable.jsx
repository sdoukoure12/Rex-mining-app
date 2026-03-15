import React from 'react';

/**
 * SimpleTable – Generic table component (Rex)
 * Props:
 *   columns: Array<{ key: string, label: string }>
 *   rows:    Array<Object>
 */
const SimpleTable = ({ columns = [], rows = [] }) => {
  if (!columns.length) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '8px 12px',
                  borderBottom: '2px solid #444',
                  textAlign: 'left',
                  background: '#1a1a2e',
                  color: '#e0e0e0',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '12px', textAlign: 'center', color: '#888' }}
              >
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row.name || row.id || idx} style={{ background: idx % 2 === 0 ? '#16213e' : '#0f3460' }}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ padding: '8px 12px', color: '#e0e0e0', borderBottom: '1px solid #333' }}
                  >
                    {row[col.key] !== undefined ? String(row[col.key]) : '–'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleTable;
