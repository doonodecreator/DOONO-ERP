import { useEffect, useState } from "react";
import api from "../services/api";

export default function ReportCards() {
    const [loading, setLoading] = useState(true);  
    const [reportCards, setReportCards] = useState([]);  
    const [selectedReport, setSelectedReport] = useState(null);  
    const [showPreview, setShowPreview] = useState(false);  
    const [search, setSearch] = useState("");  

    useEffect(() => {  
        fetchReportCards();  
    }, []);  

    async function fetchReportCards() {  
        try {  
            setLoading(true);  
            const response = await api.get("/report-cards");  
            setReportCards(response.data.data ?? []);  
        } catch (error) {  
            console.log(error);  
        } finally {  
            setLoading(false);  
        }  
    }  

    async function openReportCard(id) {  
        try {  
            const response = await api.get(`/report-cards/${id}`);  
            setSelectedReport(response.data);  
            setShowPreview(true);  
        } catch (error) {  
            console.log(error);  
        }  
    }  

    function closePreview() {  
        setSelectedReport(null);  
        setShowPreview(false);  
    }  

    function printReport() {  
        window.print();  
    }  

    const filteredCards = reportCards.filter((card) => {  
        const student = card.student_enrollment?.student;  
        if (!student) {  
            return false;  
        }  
        const fullname = `${student.surname ?? ""} ${student.first_name ?? ""} ${student.other_name ?? ""}`.toLowerCase();  
        return fullname.includes(search.toLowerCase());  
    });  

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
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">  
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">  
                    <div>  
                        <h1 className="text-3xl font-bold text-blue-700">  
                            Student Report Cards  
                        </h1>  
                        <p className="text-gray-500 mt-1">  
                            View, preview and print official report cards.  
                        </p>  
                    </div>  
                    <div className="flex gap-3">  
                        <input  
                            type="text"  
                            placeholder="Search student..."  
                            value={search}  
                            onChange={(e) => setSearch(e.target.value)}  
                            className="border rounded-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"  
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

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">  
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
                        {filteredCards.length === 0 && (  
                            <tr>  
                                <td colSpan="8" className="text-center p-10 text-gray-500">  
                                    No report cards found.  
                                </td>  
                            </tr>  
                        )}  
                        {filteredCards.map((card) => (  
                            <tr key={card.id} className="border-b hover:bg-gray-50">  
                                <td className="p-4">  
                                    <div className="font-semibold">  
                                        {card.student_enrollment?.student?.surname}{" "}  
                                        {card.student_enrollment?.student?.first_name}  
                                    </div>  
                                    <div className="text-sm text-gray-500">  
                                        {card.student_enrollment?.student?.admission_number}  
                                    </div>  
                                </td>  
                                <td className="p-4">{card.student_enrollment?.class?.name}</td>  
                                <td className="p-4">{card.academic_session?.name}</td>  
                                <td className="p-4">{card.term?.name}</td>  
                                <td className="p-4 text-center">{card.average_score}</td>  
                                <td className="p-4 text-center font-bold text-green-700">{card.overall_grade}</td>  
                                <td className="p-4 text-center">{card.position}</td>  
                                <td className="p-4 text-center">  
                                    <button  
                                        onClick={() => openReportCard(card.id)}  
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"  
                                    >  
                                        Preview  
                                    </button>  
                                </td>  
                            </tr>  
                        ))}  
                    </tbody>  
                </table>  
            </div>  

            {showPreview && selectedReport && (  
                <div className="fixed inset-0 bg-black/60 overflow-y-auto z-50">  
                    <div className="max-w-5xl mx-auto my-10 bg-white rounded-xl shadow-2xl">  
                        <div className="flex justify-between items-center p-5 border-b print:hidden">  
                            <h2 className="text-2xl font-bold text-blue-700">  
                                Report Card Preview  
                            </h2>  
                            <div className="space-x-3">  
                                <button  
                                    onClick={printReport}  
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"  
                                >  
                                    Print  
                                </button>  
                                <button  
                                    onClick={closePreview}  
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"  
                                >  
                                    Close  
                                </button>  
                            </div>  
                        </div>  

                        <div id="report-card" className="bg-white text-black p-10">  
                            <div className="flex justify-between items-start border-b-4 border-blue-700 pb-6">  
                                <div className="w-28 h-28 border rounded-full flex items-center justify-center">  
                                    <span className="text-xs text-gray-500">SCHOOL LOGO</span>  
                                </div>  
                                <div className="text-center flex-1">  
                                    <h1 className="text-4xl font-extrabold uppercase">  
                                        {selectedReport.report_card.school?.name}  
                                    </h1>  
                                    <p className="text-lg mt-2">{selectedReport.report_card.school?.address}</p>  
                                    <p>{selectedReport.report_card.school?.phone}</p>  
                                    <p>{selectedReport.report_card.school?.email}</p>  
                                    <h2 className="text-2xl font-bold mt-5 uppercase">Terminal Report Card</h2>  
                                </div>  
                                <div className="w-28 h-36 border flex items-center justify-center">  
                                    <span className="text-xs text-gray-500">PASSPORT</span>  
                                </div>  
                            </div>  

                            <div className="grid grid-cols-2 gap-8 mt-8">  
                                <div className="space-y-2">  
                                    <p>  
                                        <strong>Name:</strong>{" "}  
                                        {selectedReport.generated.student.student.surname}{" "}  
                                        {selectedReport.generated.student.student.firstname}{" "}  
                                        {selectedReport.generated.student.student.othername}  
                                    </p>  
                                    <p>  
                                        <strong>Admission No:</strong>{" "}  
                                        {selectedReport.generated.student.student.admission_number}  
                                    </p>  
                                    <p>  
                                        <strong>Gender:</strong>{" "}  
                                        {selectedReport.generated.student.student.gender}  
                                    </p>  
                                    <p>  
                                        <strong>Date of Birth:</strong>{" "}  
                                        {selectedReport.generated.student.student.date_of_birth}  
                                    </p>  
                                </div>  
                                <div className="space-y-2">  
                                    <p>  
                                        <strong>Class:</strong>{" "}  
                                        {selectedReport.generated.student.class.name}  
                                    </p>  
                                    <p>  
                                 <strong>Stream:</strong>{" "}  
                                        {selectedReport.generated.student.stream.name}  
                                    </p>  
                                    <p>  
                                        <strong>Academic Session:</strong>{" "}  
                                        {selectedReport.report_card.academic_session.name}  
                                    </p>  
                                    <p>  
                                        <strong>Term:</strong>{" "}  
                                        {selectedReport.report_card.term.name}  
                                    </p>  
                                </div>  
                            </div>  

                            <div className="mt-10">  
                                <table className="w-full border-collapse border border-gray-700">  
                                    <thead>  
                                        <tr className="bg-blue-700 text-white">  
                                            <th className="border p-3">S/N</th>  
                                            <th className="border p-3 text-left">Subject</th>  
                                            <th className="border p-3">CA</th>  
                                            <th className="border p-3">Exam</th>  
                                            <th className="border p-3">Total</th>  
                                            <th className="border p-3">Grade</th>  
                                            <th className="border p-3">Remark</th>  
                                        </tr>  
                                    </thead>  
                                    <tbody>  
                                        {selectedReport.generated.subject_results.map((result, index) => {  
                                            const ca = result.components.find(  
                                                (component) => component.assessment_structure.name.toLowerCase() === "ca"  
                                            );  
                                            const exam = result.components.find(  
                                                (component) => component.assessment_structure.name.toLowerCase() === "exam"  
                                            );  
                                            return (  
                                                <tr key={result.id} className="hover:bg-gray-100">  
                                                    <td className="border p-3 text-center">{index + 1}</td>  
                                                    <td className="border p-3 font-medium">{result.subject.name}</td>  
                                                    <td className="border p-3 text-center">{ca?.score ?? 0}</td>  
                                                    <td className="border p-3 text-center">{exam?.score ?? 0}</td>  
                                                    <td className="border p-3 text-center font-bold">{result.total_score}</td>  
                                                    <td className="border p-3 text-center">  
                                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">  
                                                            {result.grade}  
                                                        </span>  
                                                    </td>  
                                                    <td className="border p-3">{result.remark}</td>  
                                                </tr>  
                                            );  
                                        })}  
                                    </tbody>  
                                </table>  
                            </div>  

                            <div className="grid grid-cols-2 gap-8 mt-10">  
                                <div>  
                                    <h3 className="text-xl font-bold mb-3 border-b pb-2">Attendance Summary</h3>  
                                    <table className="w-full border border-gray-700">  
                                        <tbody>  
                                            <tr>  
                                                <td className="border p-2">School Days Opened</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.attendance.days_opened}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Days Present</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.attendance.days_present}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Days Absent</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.attendance.days_absent}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Attendance Percentage</td>  
                                                <td className="border p-2 text-center font-bold">  
                                                    {selectedReport.generated.attendance.attendance_percentage}%  
                                                </td>  
                                            </tr>  
                                        </tbody>  
                                    </table>  
                                </div>  

                                <div>  
                                    <h3 className="text-xl font-bold mb-3 border-b pb-2">Academic Summary</h3>  
                                    <table className="w-full border border-gray-700">  
                                        <tbody>  
                                            <tr>  
                                                <td className="border p-2">Subjects Offered</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.subjects_offered}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Subjects Passed</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.subjects_passed}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Subjects Failed</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.subjects_failed}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Total Score</td>  
                                                <td className="border p-2 text-center font-bold">  
                                                    {selectedReport.generated.summary.total_score}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Student Average</td>  
                                                <td className="border p-2 text-center font-bold">  
                                                    {selectedReport.generated.summary.student_average}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Class Average</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.class_average}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Highest Average</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.highest_average}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2">Lowest Average</td>  
                                                <td className="border p-2 text-center">  
                                                    {selectedReport.generated.summary.lowest_average}  
                                                </td>  
                                            </tr>  
                                        </tbody>  
                                    </table>  
                                </div>  
                            </div>  

                            <div className="grid grid-cols-2 gap-8 mt-10">  
                                <div>  
                                    <h3 className="text-xl font-bold border-b pb-2 mb-3">Overall Performance</h3>  
                                    <table className="w-full border border-gray-700">  
                                        <tbody>  
                                            <tr>  
                                                <td className="border p-2 font-semibold">Overall Grade</td>  
                                                <td className="border p-2 text-center">  
                                                    <span className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">  
                                                        {selectedReport.generated.summary.overall_grade}  
                                                    </span>  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2 font-semibold">Overall Remark</td>  
                                                <td className="border p-2 text-center font-semibold">  
                                                    {selectedReport.generated.summary.overall_remark}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2 font-semibold">Class Position</td>  
                                                <td className="border p-2 text-center text-red-600 font-bold">  
                                                    {selectedReport.generated.summary.position}  
                                                </td>  
                                            </tr>  
                                            <tr>  
                                                <td className="border p-2 font-semibold">Promotion Status</td>  
                                                <td className="border p-2 text-center">  
                                                    <span className="px-4 py-1 rounded-full bg-green-100 text-green-700 font-bold">  
                                                        {selectedReport.generated.summary.promotion_status}  
                                                    </span>  
                                                </td>  
                                            </tr>  
                                        </tbody>  
                                    </table>  
                                </div>  
                              <div>  
                                    <h3 className="text-xl font-bold border-b pb-2 mb-3">Comments</h3>  
                                    <div className="border border-gray-700 p-4 mb-4 rounded">  
                                        <h4 className="font-bold text-blue-700 mb-2">Class Teacher's Comment</h4>  
                                        <p>  
                                            {selectedReport.generated.summary.class_teacher_remark ||  
                                                selectedReport.report_card.teacher_comment ||  
                                                "No comment available."}  
                                        </p>  
                                    </div>  
                                    <div className="border border-gray-700 p-4 rounded">  
                                        <h4 className="font-bold text-blue-700 mb-2">Principal's Comment</h4>  
                                        <p>  
                                            {selectedReport.generated.summary.principal_remark ||  
                                                selectedReport.report_card.principal_comment ||  
                                                "No comment available."}  
                                        </p>  
                                    </div>  
                                </div>  
                            </div>   

                            <div className="mt-12">  
                                <div className="grid grid-cols-3 gap-10">  
                                    <div className="text-center">  
                                        <div className="border-b-2 border-black h-16 mb-2"></div>  
                                        <p className="font-semibold">Class Teacher's Signature</p>  
                                        <p className="text-sm text-gray-500">(Sign after printing)</p>  
                                    </div>  
                                    <div className="text-center">  
                                        <div className="border-2 border-dashed border-gray-400 h-24 flex items-center justify-center">  
                                            <span className="text-gray-400">SCHOOL STAMP</span>  
                                        </div>  
                                    </div>  
                                    <div className="text-center">  
                                        <div className="border-b-2 border-black h-16 mb-2"></div>  
                                        <p className="font-semibold">Principal's Signature</p>  
                                        <p className="text-sm text-gray-500">(Sign after printing)</p>  
                                    </div>  
                                </div>  

                                <div className="grid grid-cols-2 gap-10 mt-8">  
                                    <div>  
                                        <p className="font-semibold">Date:</p>  
                                        <div className="border-b border-black h-8"></div>  
                                    </div>  
                                    <div className="text-right">  
                                        <div className="w-24 h-24 border border-gray-400 inline-flex items-center justify-center">  
                                            <span className="text-xs text-gray-400 text-center">  
                                                QR CODE<br />Verification  
                                            </span>  
                                        </div>  
                                    </div>  
                                </div>  

                                <div className="mt-12 border-t pt-6 text-center text-sm text-gray-600">  
                                    <p>This report card is the official academic record of the student.</p>  
                                    <p className="mt-2">Any alteration without authorization from the school renders this report invalid.</p>  
                                    <p className="mt-4 font-semibold">Powered by DONO School ERP</p>  
                                </div>  
                            </div>  
                        </div>  
                    </div>  
                </div>  
            )}  
        </div>  
    );
}
