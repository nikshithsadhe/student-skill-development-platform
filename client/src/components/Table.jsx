import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className={`w-full text-left text-sm text-text ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-surface-light border-b border-border text-xs uppercase font-semibold text-text-muted ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-border/60 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true }) {
  return (
    <tr className={`${hover ? 'hover:bg-surface-light/50 transition-colors' : ''} ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th scope="col" className={`px-4 py-3.5 tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`}>
      {children}
    </td>
  );
}

export default Table;
