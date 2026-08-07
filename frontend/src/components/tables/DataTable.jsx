import "./DataTable.css";

export default function DataTable({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = "No records found.",
}) {
    if (loading) {
        return (
            <div className="table-wrapper">
                <div className="table-loading">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                style={{
                                    width: column.width || "auto",
                                    textAlign: column.align || "left",
                                }}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="empty-row"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                className={
                                    row.onClick ? "clickable-row" : ""
                                }
                                onClick={row.onClick}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        style={{
                                            textAlign:
                                                column.align || "left",
                                        }}
                                    >
                                        {column.render
                                            ? column.render(row)
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
