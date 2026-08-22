import LoadingSpinner from "../feedback/LoadingSpinner";
import EmptyState from "../feedback/EmptyState";
import Pagination from "./Pagination";
import "./DataTable.css";

export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = "No records found.", emptyTitle = "No records found", rowKey, pagination = null, onPageChange }) {
  if (loading) return <LoadingSpinner text="Loading records..." />;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div className="dono-table-container">
      <table className="dono-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align ? `align-${col.align}` : ""}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIndex) => {
            const key = rowKey ? rowKey(row) : row.id || rIndex;
            return (
              <tr key={key} onClick={row.onClick} className={row.onClick ? "clickable-row" : ""}>
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label} className={col.align ? `align-${col.align}` : ""}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {pagination && <Pagination meta={pagination} onPageChange={onPageChange} loading={loading} />}
    </div>
  );
}
