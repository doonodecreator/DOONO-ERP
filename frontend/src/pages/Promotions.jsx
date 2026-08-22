import { useEffect, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";

const STATUS_OPTIONS = [
    "Promoted",
    "Repeated",
    "Transferred",
    "Graduated",
];

export default function Promotions() {

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");

    const [records, setRecords] = useState([]);

    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [streams, setStreams] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [stats, setStats] = useState({
        total: 0,
        promoted: 0,
        repeated: 0,
        transferred: 0,
        graduated: 0,
    });

    const emptyForm = {
        student_id: "",
        from_academic_session_id: "",
        to_academic_session_id: "",
        from_division_id: "",
        to_division_id: "",
        from_class_id: "",
        to_class_id: "",
        from_stream_id: "",
        to_stream_id: "",
        promotion_date: "",
        promotion_status: "Promoted",
        remarks: "",
    };

    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        try {

            setLoading(true);

            const [
                promotionRes,
                studentRes,
                sessionRes,
                divisionRes,
                classRes,
                streamRes,
            ] = await Promise.all([
                api.get("/promotions"),
                api.get("/students"),
                api.get("/academic-sessions"),
                api.get("/divisions"),
                api.get("/classes"),
                api.get("/streams"),
            ]);

            const promotionData = arrayFromResponse(promotionRes);

            setRecords(promotionData);

            setStudents(arrayFromResponse(studentRes));
            setSessions(arrayFromResponse(sessionRes));
            setDivisions(arrayFromResponse(divisionRes));
            setClasses(arrayFromResponse(classRes));
            setStreams(arrayFromResponse(streamRes));

            calculateStats(promotionData);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    }

    function calculateStats(data) {

        setStats({

            total: data.length,

            promoted: data.filter(
                (item) => item.promotion_status === "Promoted"
            ).length,

            repeated: data.filter(
                (item) => item.promotion_status === "Repeated"
            ).length,

            transferred: data.filter(
                (item) => item.promotion_status === "Transferred"
            ).length,

            graduated: data.filter(
                (item) => item.promotion_status === "Graduated"
            ).length,

        });

    }

     const filteredRecords = records.filter((record) => {

        const fullname = `${record.student?.surname ?? ""} ${record.student?.first_name ?? ""} ${record.student?.other_name ?? ""}`.toLowerCase();

        const matchesSearch = fullname.includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "" ||
            record.promotion_status === statusFilter;

        return matchesSearch && matchesStatus;

    });

    function openCreateModal() {

        setEditingId(null);

        setForm(emptyForm);

        setShowModal(true);

    }

    function openEditModal(record) {

        setEditingId(record.id);

        setForm({

            student_id: record.student_id,

            from_academic_session_id:
                record.from_academic_session_id,

            to_academic_session_id:
                record.to_academic_session_id,

            from_division_id:
                record.from_division_id,

            to_division_id:
                record.to_division_id,

            from_class_id:
                record.from_class_id,

            to_class_id:
                record.to_class_id,

            from_stream_id:
                record.from_stream_id ?? "",

            to_stream_id:
                record.to_stream_id ?? "",

            promotion_date:
                record.promotion_date,

            promotion_status:
                record.promotion_status,

            remarks:
                record.remarks ?? "",

        });

        setShowModal(true);

    }

    function closeModal() {

        setShowModal(false);

        setEditingId(null);

        setForm(emptyForm);

    }

    async function deleteRecord(record) {
        if (!record?.id || !window.confirm("Delete this promotion record? This action cannot be undone.")) return;
        try {
            setActionError("");
            await api.delete(`/promotions/${record.id}`);
            await loadData();
        } catch (error) {
            setActionError(error.message || "The promotion record could not be deleted.");
        }
    }

    if (loading) {

        return (

            <div className="flex items-center justify-center h-screen">

                <h2 className="text-2xl font-bold text-blue-700">

                    Loading Promotion & Graduation...

                </h2>

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-gray-100 p-6">

            {actionError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{actionError}</div>}

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div>

                        <h1 className="text-3xl font-bold text-blue-700">

                            Promotion & Graduation

                        </h1>

                        <p className="text-gray-500 mt-2">

                            Manage promotions, repetitions, transfers and graduations.

                        </p>

                    </div>

                    <div className="flex gap-3">

                        <input
                            type="text"
                            placeholder="Search student..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            className="border rounded-lg px-4 py-2 w-72"
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="border rounded-lg px-4 py-2"
                        >

                            <option value="">
                                All Status
                            </option>

                            {STATUS_OPTIONS.map((status) => (

                                <option
                                    key={status}
                                    value={status}
                                >

                                    {status}

                                </option>

                            ))}

                        </select>

                        <button type="button"
                            onClick={openCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >

                            + New Record

                        </button>

                    </div>

                </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-6">

                <div className="bg-white rounded-xl shadow p-5">

                    <p className="text-gray-500 text-sm">

                        Total Records

                    </p>

                    <h2 className="text-3xl font-bold">

                        {stats.total}

                    </h2>

                </div>

                <div className="bg-green-100 rounded-xl shadow p-5">

                    <p className="text-green-700 text-sm">

                        Promoted

                    </p>

                    <h2 className="text-3xl font-bold text-green-700">

                        {stats.promoted}

                    </h2>

                </div>

                <div className="bg-yellow-100 rounded-xl shadow p-5">

                    <p className="text-yellow-700 text-sm">

                        Repeated

                    </p>

                    <h2 className="text-3xl font-bold text-yellow-700">

                        {stats.repeated}

                    </h2>

                </div>

                <div className="bg-purple-100 rounded-xl shadow p-5">

                    <p className="text-purple-700 text-sm">

                        Transferred

                    </p>

                    <h2 className="text-3xl font-bold text-purple-700">

                        {stats.transferred}

                    </h2>

                </div>

                <div className="bg-blue-100 rounded-xl shadow p-5">

                    <p className="text-blue-700 text-sm">

                        Graduated

                    </p>

                    <h2 className="text-3xl font-bold text-blue-700">

                        {stats.graduated}

                    </h2>

                </div>

            </div>

                     <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                <table className="w-full">

                    <thead className="bg-blue-700 text-white">

                        <tr>

                            <th className="p-4 text-left">
                                Student
                            </th>

                            <th className="p-4 text-left">
                                From
                            </th>

                            <th className="p-4 text-left">
                                To
                            </th>

                            <th className="p-4 text-center">
                                Status
                            </th>

                            <th className="p-4 text-center">
                                Date
                            </th>

                            <th className="p-4 text-center">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredRecords.length === 0 && (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="text-center p-10 text-gray-500"
                                >

                                    No promotion records found.

                                </td>

                            </tr>

                        )}

                        {filteredRecords.map((record) => (

                            <tr
                                key={record.id}
                                className="border-b hover:bg-gray-50"
                            >

                                <td className="p-4">

                                    <div className="font-semibold">

                                        {record.student?.surname}{" "}
                                        {record.student?.first_name}{" "}
                                        {record.student?.other_name}

                                    </div>

                                    <div className="text-sm text-gray-500">

                                        {record.student?.admission_number}

                                    </div>

                                </td>

                                <td className="p-4">

                                    <div>

                                        {record.from_class?.name}

                                    </div>

                                    <div className="text-xs text-gray-500">

                                        {record.from_stream?.name ?? "No Stream"}

                                    </div>

                                </td>

                                <td className="p-4">

                                    <div>

                                        {record.to_class?.name}

                                    </div>

                                    <div className="text-xs text-gray-500">

                                        {record.to_stream?.name ?? "No Stream"}

                                    </div>

                                </td>

                                <td className="p-4 text-center">

                                    <span
                                        className={`px-4 py-1 rounded-full text-sm font-bold ${
                                            record.promotion_status === "Promoted"
                                                ? "bg-green-100 text-green-700"
                                                : record.promotion_status === "Repeated"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : record.promotion_status === "Transferred"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700"
                                        }`}
                                    >

                                        {record.promotion_status}

                                    </span>

                                </td>

                                <td className="p-4 text-center">

                                    {record.promotion_date}

                                </td>

                                <td className="p-4 text-center">

                                    <div className="flex justify-center gap-2">

                                        <button type="button"
                                            onClick={() =>
                                                openEditModal(record)
                                            }
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                        >

                                            Edit

                                        </button>

                                        <button type="button"
                                            onClick={() => deleteRecord(record)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                        >

                                            Delete

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

              {showModal && (

                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">

                            <h2 className="text-2xl font-bold text-blue-700">

                                {editingId
                                    ? "Edit Promotion / Graduation"
                                    : "New Promotion / Graduation"}

                            </h2>

                            <button type="button"
                                onClick={closeModal}
                                className="text-red-600 text-xl font-bold"
                            >

                                ✕

                            </button>

                        </div>

                        <div className="grid grid-cols-2 gap-5">

                            <div>

                                <label className="font-semibold">

                                    Student

                                </label>

                                <select
                                    value={form.student_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            student_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">
                                        Select Student
                                    </option>

                                    {students.map((student) => (

                                        <option
                                            key={student.id}
                                            value={student.id}
                                        >

                                            {student.surname}{" "}
                                            {student.first_name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    Promotion Status

                                </label>

                                <select
                                    value={form.promotion_status}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            promotion_status:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    {STATUS_OPTIONS.map((status) => (

                                        <option
                                            key={status}
                                            value={status}
                                        >

                                            {status}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    From Academic Session

                                </label>

                                <select
                                    value={form.from_academic_session_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            from_academic_session_id:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">
                                        Select Session
                                    </option>

                                    {sessions.map((session) => (

                                        <option
                                            key={session.id}
                                            value={session.id}
                                        >

                                            {session.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    To Academic Session

                                </label>

                                <select
                                    value={form.to_academic_session_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            to_academic_session_id:
                                                e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">
                                        Select Session
                                    </option>

                                    {sessions.map((session) => (

                                        <option
                                            key={session.id}
                                            value={session.id}
                                        >

                                            {session.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                             <div>

                                <label className="font-semibold">

                                    From Division

                                </label>

                                <select
                                    value={form.from_division_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            from_division_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">Select Division</option>

                                    {divisions.map((division) => (

                                        <option
                                            key={division.id}
                                            value={division.id}
                                        >

                                            {division.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    To Division

                                </label>

                                <select
                                    value={form.to_division_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            to_division_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">Select Division</option>

                                    {divisions.map((division) => (

                                        <option
                                            key={division.id}
                                            value={division.id}
                                        >

                                            {division.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    From Class

                                </label>

                                <select
                                    value={form.from_class_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            from_class_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">Select Class</option>

                                    {classes.map((item) => (

                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >

                                            {item.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    To Class

                                </label>

                                <select
                                    value={form.to_class_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            to_class_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">Select Class</option>

                                    {classes.map((item) => (

                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >

                                            {item.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    From Stream

                                </label>

                                <select
                                    value={form.from_stream_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            from_stream_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">No Stream</option>

                                    {streams.map((stream) => (

                                        <option
                                            key={stream.id}
                                            value={stream.id}
                                        >

                                            {stream.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div>

                                <label className="font-semibold">

                                    To Stream

                                </label>

                                <select
                                    value={form.to_stream_id}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            to_stream_id: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                >

                                    <option value="">No Stream</option>

                                    {streams.map((stream) => (

                                        <option
                                            key={stream.id}
                                            value={stream.id}
                                        >

                                            {stream.name}

                                        </option>

                                    ))}

                                </select>

                            </div>

                                                       <div>

                                <label className="font-semibold">

                                    Promotion Date

                                </label>

                                <input
                                    type="date"
                                    value={form.promotion_date}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            promotion_date: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                />

                            </div>

                            <div>

                                <label className="font-semibold">

                                    Remarks

                                </label>

                                <textarea
                                    rows="4"
                                    value={form.remarks}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            remarks: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-lg p-3 mt-1"
                                />

                            </div>

                        </div>

                        <div className="flex justify-end gap-3 mt-8">

                            <button type="button"
                                onClick={closeModal}
                                className="px-6 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 font-semibold"
                            >

                                Cancel

                            </button>

                            <button type="button"
                                disabled={saving}
                                onClick={savePromotion}
                                className="px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold"
                            >

                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Record"
                                    : "Save Record"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

    async function savePromotion() {

        try {

            setSaving(true);

            if (editingId) {

                await api.put(
                    `/promotions/${editingId}`,
                    form
                );

            } else {

                await api.post(
                    "/promotions",
                    form
                );

            }

            closeModal();

            loadData();

        } catch (error) {

            console.log(error);

            alert(
                error?.response?.data?.message ??
                "Unable to save promotion."
            );

        } finally {

            setSaving(false);

        }

    }

}
