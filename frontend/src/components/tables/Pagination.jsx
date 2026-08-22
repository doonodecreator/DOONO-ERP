import Button from "../forms/Button";
import "./Pagination.css";

export default function Pagination({ meta, onPageChange, loading = false }) {
  const currentPage = Number(meta?.current_page || 1);
  const lastPage = Number(meta?.last_page || 1);
  const total = Number(meta?.total || 0);
  const from = Number(meta?.from || 0);
  const to = Number(meta?.to || 0);

  if (lastPage <= 1 && total <= 0) return null;

  return (
    <nav className="dono-pagination" aria-label="Pagination">
      <span className="dono-pagination-summary">
        {total > 0 ? `Showing ${from}–${to} of ${total}` : "No records"}
      </span>
      <div className="dono-pagination-actions">
        <Button size="sm" variant="secondary" type="button" disabled={loading || currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} aria-label="Previous page">Previous</Button>
        <span className="dono-pagination-page" aria-live="polite">Page {currentPage} of {lastPage}</span>
        <Button size="sm" variant="secondary" type="button" disabled={loading || currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)} aria-label="Next page">Next</Button>
      </div>
    </nav>
  );
}
