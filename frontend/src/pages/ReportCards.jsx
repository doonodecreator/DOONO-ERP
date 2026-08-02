import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ReportCards({ setPage }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportCards, setReportCards] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Detect user roles
    const userRole = (
        user?.role ||
        user?.roles?.[0]?.slug ||
        user?.roles?.[0]?.name ||
        "guest"
    ).toLowerCase();

    const isStudent = userRole === "student";
    const isParent = userRole === "parent";
    const isViewOnlyUser = isStudent || isParent;

    useEffect(() => {
        fetchReportCards();
    }, []);

    async function fetchReportCards() {
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/report-cards");
            // Controller returns Laravel paginated collection: response.data.data
            const rawData = response?.data?.data ?? response?.data ?? [];
            setReportCards(Array.isArray(rawData) ? rawData : []);
        } catch (err) {
            console.error("Failed to fetch report cards:", err);
            setError("Unable to load report cards.");
        } finally {
            setLoading(false);
        }
    }

    async function openReportCard(id) {
        try {
            setError("");
            const response = await api.get(`/report-cards/${id}`);
            setSelectedReport(response.data);
            setShowPreview(true);
        } catch (err) {
            console.error("Failed to load report card details:", err);
            setError("Unable to load report card details.");
        }
    }

    function closePreview() {
        setSelectedReport(null);
        setShowPreview(false);
    }

    function printReport() {
        window.print();
    }

    // Role-aware filtering
    const filteredCards = reportCards.filter((card) => {
        const student = card.student_enrollment?.student || card.student;
        if (!student) return false;

        if (isStudent) {
            const studentUserId = student.user_id || student.id;
            const currentUserId = user?.student_id || user?.id;
            if (studentUserId !== currentUserId && student.admission_number !== user?.admission_number) {
                return false;
            }
        }

        if (isParent) {
            const linkedChildrenIds = user?.children_ids || user?.children?.map(c => c.id) || [];
            const studentId = student.id;
            if (linkedChildrenIds.length > 0 && !linkedChildrenIds.includes(studentId)) {
                return false;
            }
        }

        const fullname = `${student.surname ?? ""} ${student.first_name ?? student.firstname ?? ""} ${student.other_name ?? student.othername ?? ""}`.toLowerCase();
        return (
            fullname.includes(search.toLowerCase()) ||
            (student.admission_number && student.admission_number.toLowerCase().includes(search.toLowerCase()))
        );
    });

    // Helper to safely get component name (camelCase or snake_case)
    const getComponentName = (comp) => {
        return (
            comp?.assessment_structure?.name ||
            comp?.assessmentStructure?.name ||
            "Component"
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl font-bold text-blue-700">
                    Loading Report Cards...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"> 
                    <div>
                        <h1 className="text-3xl font-bold text-blue-700">
                            {isViewOnlyUser ? "Academic Report Cards" : "Student Report Cards"}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isStudent && "View and print your official term report card."}
                            {isParent && "View official term report cards for your child."}
                            {!isViewOnlyUser && "View, preview, and print official student report cards."}
                        </p>
                    </div>
                    <div className="flex gap-3 items-center flex-wrap">
                        {setPage && (
                            <button
                                onClick={() => setPage("results")}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                            >
                                &larr; Back to Exams
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Search student or adm no..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={fetchReportCards}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 print:hidden">{error}</div>}

            {/* List Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-blue-700 text-white">
                            <tr>
                                <th className="p-4 text-left">Student</th>
                                <th className="p-4 text-left">Class</th>
                                <th className="p-4 text-left">Session</th>
                                <th className="p-4 text-left">Term</th>
                                <th className="p-4 text-center">Average</th>
                                <th className="p-4 text-center">Grade</th>
                                <th className="p-4 text-center">Position</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCards.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-10 text-gray-500">
                                        No report cards available at this time.
                                    </td>
                                </tr>
                            ) : (
                                filteredCards.map((card) => {
                                    const student = card.student_enrollment?.student || card.student || {};
                                    const classObj = card.student_enrollment?.class || card.class || {};

                                    return (
                                        <tr key={card.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-semibold">
                                                    {student.surname ?? ""} {student.first_name ?? student.firstname ?? ""}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {student.admission_number || "-"}
                                                </div>
                                            </td>
                                            <td className="p-4">{classObj.name || "-"}</td>
                                            <td className="p-4">{card.academic_session?.name || "-"}</td>
                                            <td className="p-4">{card.term?.name || "-"}</td>
                                            <td className="p-4 text-center font-semibold">{card.average_score ?? card.overall_average ?? "-"}</td>
                                            <td className="p-4 text-center font-bold text-green-700">{card.overall_grade || "-"}</td>
                                            <td className="p-4 text-center">{card.position || "-"}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => openReportCard(card.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                                                >
                                                    View Card
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

{/* Modal Preview & Printable Area */}
            {showPreview && selectedReport && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto z-50 p-2 md:p-6 print:p-0 print:static print:bg-white">
                    <div className="max-w-5xl mx-auto my-4 bg-white rounded-xl shadow-2xl print:shadow-none print:my-0">
                        {/* Header controls (hidden when printing) */}
                        <div className="flex justify-between items-center p-5 border-b print:hidden">
                            <h2 className="text-2xl font-bold text-blue-700">
                                Official Report Card Preview
                            </h2>
                            <div className="space-x-3">
                                <button
                                    onClick={printReport}
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                                >
                                    Print / PDF
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Printable Document Sheet */}
                        <div id="report-card" className="bg-white text-black p-8 md:p-10">
                            {/* School Header */}
                            <div className="flex justify-between items-start border-b-4 border-blue-700 pb-6 gap-4">
                                <div className="w-24 h-24 border rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                    {selectedReport.report_card?.school?.logo ? (
                                        <img
                                            src={selectedReport.report_card.school.logo}
                                            alt="School Logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-gray-500 font-bold">LOGO</span>
                                    )}
                                </div>
                                <div className="text-center flex-1">
                                    <h1 className="text-3xl md:text-4xl font-extrabold uppercase text-blue-900">
                                        {selectedReport.report_card?.school?.name || "SCHOOL NAME"}
                                    </h1>
                                    <p className="text-sm mt-1">{selectedReport.report_card?.school?.address}</p>
                                    <p className="text-xs text-gray-600">
                                        Phone: {selectedReport.report_card?.school?.phone || "-"} | Email: {selectedReport.report_card?.school?.email || "-"}
                                    </p>
                                    <h2 className="text-xl font-bold mt-4 uppercase tracking-wider text-gray-800">
                                        Terminal Report Card
                                    </h2>
                                </div>
                                <div className="w-24 h-28 border flex items-center justify-center shrink-0">
                                    <span className="text-xs text-gray-400 font-bold">PASSPORT</span>
                                </div>
                            </div>

                            {/* Student Metadata */}
                            <div className="grid grid-cols-2 gap-6 mt-6 bg-gray-50 p-4 rounded-lg border text-sm">
                                <div className="space-y-2">
                                    <p><strong>Student Name:</strong> {selectedReport.generated?.student?.student?.surname || ""} {selectedReport.generated?.student?.student?.first_name || selectedReport.generated?.student?.student?.firstname || ""} {selectedReport.generated?.student?.student?.other_name || selectedReport.generated?.student?.student?.othername || ""}</p>
                                    <p><strong>Admission No:</strong> {selectedReport.generated?.student?.student?.admission_number || "-"}</p>
                                    <p><strong>Gender:</strong> {selectedReport.generated?.student?.student?.gender || "-"}</p>
                                    <p><strong>Date of Birth:</strong> {selectedReport.generated?.student?.student?.date_of_birth || "-"}</p>
                                    {selectedReport.generated?.parent && (
                                        <p><strong>Parent/Guardian:</strong> {selectedReport.generated.parent.first_name || ""} {selectedReport.generated.parent.last_name || ""}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p><strong>Class:</strong> {selectedReport.generated?.student?.class?.name || selectedReport.report_card?.student_enrollment?.class?.name || "-"}</p>
                                    <p><strong>Stream/Arm:</strong> {selectedReport.generated?.student?.stream?.name || "-"}</p>
                                    <p><strong>Academic Session:</strong> {selectedReport.report_card?.academic_session?.name || "-"}</p>
                                    <p><strong>Term:</strong> {selectedReport.report_card?.term?.name || "-"}</p>
                                </div>
                            </div>

                            {/* Subject Results Table */}
                            <div className="mt-8 overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-700 text-sm">
                                    <thead>
                                        <tr className="bg-blue-700 text-white">
                                            <th className="border border-gray-700 p-2 text-center">S/N</th>
                                            <th className="border border-gray-700 p-2 text-left">Subject</th>
                                            <th className="border border-gray-700 p-2 text-center">Assessment Components</th>
                                            <th className="border border-gray-700 p-2 text-center">Total Score</th>
                                            <th className="border border-gray-700 p-2 text-center">Grade</th>
                                            <th className="border border-gray-700 p-2 text-left">Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedReport.generated?.subject_results || []).length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center p-4 text-gray-500">
                                                    No subject results recorded for this term.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedReport.generated.subject_results.map((result, index) => {
                                                const components = result.components || [];

                                                return (
                                                    <tr key={result.id || index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-700 p-2 text-center">{index + 1}</td>
                                                        <td className="border border-gray-700 p-2 font-medium">{result.subject?.name || "-"}</td>
                                                        <td className="border border-gray-700 p-2">
                                                            <div className="flex flex-wrap gap-2 justify-center">
                                                                {components.length > 0 ? (
                                                                    components.map((c, idx) => (
                                                                        <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded border text-xs">
                                                                            <strong>{getComponentName(c)}:</strong> {c.score}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">-</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-700 p-2 text-center font-bold text-blue-900">{result.total_score ?? "-"}</td>
                                                        <td className="border border-gray-700 p-2 text-center font-bold text-green-700">{result.grade || "-"}</td>
                                                        <td className="border border-gray-700 p-2">{result.remark || "-"}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Attendance & Summary Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {/* Attendance Summary */}
                                <div>
                                    <h3 className="text-lg font-bold mb-2 border-b-2 border-blue-700 pb-1">Attendance Record</h3>
                                    <table className="w-full border border-gray-700 text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="border p-2">School Days Opened</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.attendance?.days_opened ?? 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Days Present</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.attendance?.days_present ?? 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Days Absent</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.attendance?.days_absent ?? 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Days Late</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.attendance?.days_late ?? 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Days Excused</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.attendance?.days_excused ?? 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Attendance Rate</td>
                                                <td className="border p-2 text-center font-bold text-green-700">{selectedReport.generated?.attendance?.attendance_percentage ?? 0}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Academic Performance Summary */}
                                <div>
                                    <h3 className="text-lg font-bold mb-2 border-b-2 border-blue-700 pb-1">Academic Performance Summary</h3>
                                    <table className="w-full border border-gray-700 text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="border p-2">Subjects Offered</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.summary?.subjects_offered ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Subjects Passed</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.summary?.subjects_passed ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Subjects Failed</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.summary?.subjects_failed ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Total Score Obtained</td>
                                                <td className="border p-2 text-center font-bold">{selectedReport.generated?.summary?.total_score ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Student Average</td>
                                                <td className="border p-2 text-center font-bold text-blue-700">{selectedReport.generated?.summary?.student_average ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Class Average</td>
                                                <td className="border p-2 text-center font-semibold">{selectedReport.generated?.summary?.class_average ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Class Position</td>
                                                <td className="border p-2 text-center font-bold text-purple-700">{selectedReport.generated?.summary?.position ?? selectedReport.report_card?.position ?? "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border p-2">Overall Grade</td>
                                                <td className="border p-2 text-center font-bold text-green-700">{selectedReport.generated?.summary?.overall_grade ?? selectedReport.report_card?.overall_grade ?? "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

