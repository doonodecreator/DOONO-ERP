import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const COLORS = [
    "bg-blue-100 border-blue-500",
    "bg-green-100 border-green-500",
    "bg-purple-100 border-purple-500",
    "bg-yellow-100 border-yellow-500",
    "bg-pink-100 border-pink-500",
    "bg-orange-100 border-orange-500",
    "bg-cyan-100 border-cyan-500",
    "bg-red-100 border-red-500",
];

export default function Timetable() {

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [timetables, setTimetables] = useState([]);

    const [academicSessions, setAcademicSessions] = useState([]);

    const [terms, setTerms] = useState([]);

    const [divisions, setDivisions] = useState([]);

    const [classes, setClasses] = useState([]);

    const [streams, setStreams] = useState([]);

    const [subjects, setSubjects] = useState([]);

    const [teachers, setTeachers] = useState([]);

    const [schools, setSchools] = useState([]);

    const [search, setSearch] = useState("");

    const [selectedDay, setSelectedDay] = useState("");

    const [selectedSession, setSelectedSession] = useState("");

    const [selectedTerm, setSelectedTerm] = useState("");

    const [selectedDivision, setSelectedDivision] = useState("");

    const [selectedClass, setSelectedClass] = useState("");

    const [selectedStream, setSelectedStream] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        school_id: "",
        academic_session_id: "",
        term_id: "",
        division_id: "",
        class_id: "",
        stream_id: "",
        subject_id: "",
        staff_id: "",
        day_of_week: "Monday",
        start_time: "",
        end_time: "",
        room: "",
        is_active: true,
    });

    useEffect(() => {
        loadEverything();
    }, []);

    async function loadEverything() {
        try {

            setLoading(true);

            const [
                timetableRes,
                schoolRes,
                sessionRes,
                termRes,
                divisionRes,
                classRes,
                streamRes,
                subjectRes,
                teacherRes,
            ] = await Promise.all([
                api.get("/timetables"),
                api.get("/schools"),
                api.get("/academic-sessions"),
                api.get("/terms"),
                api.get("/divisions"),
                api.get("/classes"),
                api.get("/streams"),
                api.get("/subjects"),
                api.get("/staff"),
            ]);

            setTimetables(timetableRes.data.data ?? []);

            setSchools(schoolRes.data.data ?? []);

            setAcademicSessions(sessionRes.data.data ?? []);

            setTerms(termRes.data.data ?? []);

            setDivisions(divisionRes.data.data ?? []);

            setClasses(classRes.data.data ?? []);

            setStreams(streamRes.data.data ?? []);

            setSubjects(subjectRes.data.data ?? []);

            setTeachers(teacherRes.data.data ?? []);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }
    }

    function resetForm() {

        setEditingId(null);

        setForm({
            school_id: "",
            academic_session_id: "",
            term_id: "",
            division_id: "",
            class_id: "",
            stream_id: "",
            subject_id: "",
            staff_id: "",
            day_of_week: "Monday",
            start_time: "",
            end_time: "",
            room: "",
            is_active: true,
        });
    }

    function openCreate() {
        resetForm();
        setShowModal(true);
    }

    function openEdit(item) {

        setEditingId(item.id);

        setForm({
            school_id: item.school_id ?? "",
            academic_session_id: item.academic_session_id ?? "",
            term_id: item.term_id ?? "",
            division_id: item.division_id ?? "",
            class_id: item.class_id ?? "",
            stream_id: item.stream_id ?? "",
            subject_id: item.subject_id ?? "",
            staff_id: item.staff_id ?? "",
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            room: item.room ?? "",
            is_active: item.is_active,
        });

        setShowModal(true);
    }

    function closeModal() {
        resetForm();
        setShowModal(false);
    }

    async function saveTimetable(e) {

        e.preventDefault();

        if (form.end_time <= form.start_time) {
            alert("End time must be later than Start time.");
            return;
        }

        try {

            setSaving(true);

            if (editingId) {

                await api.put(`/timetables/${editingId}`, form);

            } else {

                await api.post("/timetables", form);

            }

            closeModal();

            loadEverything();

        } catch (error) {

            console.log(error);

            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert("Unable to save timetable.");
            }

        } finally {

            setSaving(false);

        }

    }

    async function deleteTimetable(id) {

        const confirmed = window.confirm(
            "Delete this timetable permanently?"
        );

        if (!confirmed) return;

        try {

            await api.delete(`/timetables/${id}`);

            loadEverything();

        } catch (error) {

            console.log(error);

            alert("Unable to delete timetable.");

        }

    }

    function getColor(subjectId) {

        if (!subjectId) {
            return COLORS[0];
        }

        return COLORS[subjectId % COLORS.length];

    }

    function formatTime(time) {

        if (!time) return "";

        return time.substring(0, 5);

    }

    function printTimetable() {

        window.print();

    }

    const filteredTimetable = useMemo(() => {

        return timetables.filter((item) => {

            const subject =
                item.subject?.name?.toLowerCase() ?? "";

            const teacher =
                item.staff?.user?.name?.toLowerCase() ??
                item.staff?.name?.toLowerCase() ??
                "";

            const room =
                item.room?.toLowerCase() ?? "";

            const keyword = search.toLowerCase();

            const matchSearch =
                subject.includes(keyword) ||
                teacher.includes(keyword) ||
                room.includes(keyword);

            const matchDay =
                selectedDay === "" ||
                item.day_of_week === selectedDay;

            const matchSession =
                selectedSession === "" ||
                String(item.academic_session_id) ===
                    String(selectedSession);

            const matchTerm =
                selectedTerm === "" ||
                String(item.term_id) ===
                    String(selectedTerm);

            const matchDivision =
                selectedDivision === "" ||
                String(item.division_id) ===
                    String(selectedDivision);

            const matchClass =
                selectedClass === "" ||
                String(item.class_id) ===
                    String(selectedClass);

            const matchStream =
                selectedStream === "" ||
                String(item.stream_id ?? "") ===
                    String(selectedStream);

            return (
                matchSearch &&
                matchDay &&
                matchSession &&
                matchTerm &&
                matchDivision &&
                matchClass &&
                matchStream
            );

        });

    }, [
        timetables,
        search,
        selectedDay,
        selectedSession,
        selectedTerm,
        selectedDivision,
        selectedClass,
        selectedStream,
    ]);

    const groupedTimetable = useMemo(() => {

        const grouped = {};

        DAYS.forEach((day) => {
            grouped[day] = [];
        });

        filteredTimetable.forEach((item) => {

            grouped[item.day_of_week].push(item);

        });

        Object.keys(grouped).forEach((day) => {

            grouped[day].sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
            );

        });

        return grouped;

    }, [filteredTimetable]);

    if (loading) {

        return (

            <div className="flex justify-center items-center h-screen">

                <h2 className="text-2xl font-bold text-blue-700">

                    Loading Timetable...

                </h2>

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-gray-100 p-6">

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>

                        <h1 className="text-3xl font-bold text-blue-700">

                            School Timetable

                        </h1>

                        <p className="text-gray-500 mt-1">

                            Manage, organize and print school timetables.

                        </p>

                    </div>

                    <div className="flex flex-wrap gap-3">

                        <button
                            onClick={openCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >
                            + Add Timetable
                        </button>

                        <button
                            onClick={loadEverything}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >
                            Refresh
                        </button>

                        <button
                            onClick={printTimetable}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >
                            Print
                        </button>

                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">

                    <input
                        type="text"
                        placeholder="Search subject, teacher or room..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    />

                    <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Sessions</option>

                        {academicSessions.map((item) => (

                            <option key={item.id} value={item.id}>

                                {item.name}

                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Terms</option>

                        {terms.map((item) => (

                            <option key={item.id} value={item.id}>

                                {item.name}

                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Divisions</option>

                        {divisions.map((item) => (

                            <option key={item.id} value={item.id}>

                                {item.name}

                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Classes</option>

                        {classes.map((item) => (

                            <option key={item.id} value={item.id}>

                                {item.name}

                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedStream}
                        onChange={(e) => setSelectedStream(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Streams</option>

                        {streams.map((item) => (

                            <option key={item.id} value={item.id}>

                                {item.name}

                            </option>

                        ))}

                    </select>

                    <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="border rounded-lg px-4 py-2"
                    >

                        <option value="">All Days</option>

                        {DAYS.map((day) => (

                            <option key={day} value={day}>

                                {day}

                            </option>

                        ))}

                    </select>

                </div>

            </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                {DAYS.map((day) => (

                    <div
                        key={day}
                        className="bg-white rounded-xl shadow-lg overflow-hidden"
                    >

                        <div className="bg-blue-700 text-white px-5 py-3">

                            <h2 className="text-xl font-bold">

                                {day}

                            </h2>

                        </div>

                        <div className="p-4 space-y-4 min-h-[320px]">

                            {groupedTimetable[day].length === 0 && (

                                <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">

                                    No timetable available

                                </div>

                            )}

                            {groupedTimetable[day].map((item) => (

                                <div
                                    key={item.id}
                                    className={`border-l-4 rounded-lg shadow-sm p-4 ${getColor(item.subject_id)}`}
                                >

                                    <div className="flex justify-between items-start">

                                        <div>

                                            <h3 className="font-bold text-lg">

                                                {item.subject?.name}

                                            </h3>

                                            <p className="text-sm text-gray-600">

                                                Teacher:{" "}
                                                {item.staff?.user?.name ??
                                                    item.staff?.name ??
                                                    "Not Assigned"}

                                            </p>

                                            <p className="text-sm text-gray-600">

                                                Class: {item.class?.name}

                                                {item.stream
                                                    ? ` (${item.stream.name})`
                                                    : ""}

                                            </p>

                                            <p className="text-sm text-gray-600">

                                                Room: {item.room || "N/A"}

                                            </p>

                                            <p className="font-semibold mt-2">

                                                {formatTime(item.start_time)}
                                                {" - "}
                                                {formatTime(item.end_time)}

                                            </p>

                                        </div>

                                        <div className="flex flex-col gap-2">

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >

                                                {item.is_active
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}

                                            </span>

                                            <button
                                                onClick={() => openEdit(item)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                            >

                                                Edit

                                            </button>

                                            <button
                                                onClick={() =>
                                                    deleteTimetable(item.id)
                                                }
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                            >

                                                Delete

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                ))}

            </div>
                    {showModal && (

                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">

                        <div className="flex justify-between items-center border-b p-6">

                            <h2 className="text-2xl font-bold text-blue-700">

                                {editingId ? "Edit Timetable" : "Add Timetable"}

                            </h2>

                            <button

                                onClick={closeModal}

                                className="text-red-600 font-bold text-xl"

                            >

                                ✕

                            </button>

                        </div>

                        <form
                            onSubmit={saveTimetable}
                            className="p-6 space-y-6"
                        >

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <div>

                                    <label className="font-semibold">

                                        School

                                    </label>

                                    <select
                                        value={form.school_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                school_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">
                                            Select School
                                        </option>

                                        {schools.map((item) => (

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

                                        Academic Session

                                    </label>

                                    <select
                                        value={form.academic_session_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                academic_session_id:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">
                                            Select Session
                                        </option>

                                        {academicSessions.map((item) => (

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

                                        Term

                                    </label>

                                    <select
                                        value={form.term_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                term_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">
                                            Select Term
                                        </option>

                                        {terms.map((item) => (

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

                                        Division

                                    </label>

                                    <select
                                        value={form.division_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                division_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">
                                            Select Division
                                        </option>

                                        {divisions.map((item) => (

                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >

                                                {item.name}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                <div>

                                    <label className="font-semibold">

                                        Class

                                    </label>

                                    <select
                                        value={form.class_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                class_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
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

                                        Stream

                                    </label>

                                    <select
                                        value={form.stream_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                stream_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                    >

                                        <option value="">No Stream</option>

                                        {streams.map((item) => (

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

                                        Subject

                                    </label>

                                    <select
                                        value={form.subject_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                subject_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">Select Subject</option>

                                        {subjects.map((item) => (

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

                                        Teacher

                                    </label>

                                    <select
                                        value={form.staff_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                staff_id: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                    >

                                        <option value="">
                                            Select Teacher
                                        </option>

                                        {teachers.map((item) => (

                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >

                                                {item.user?.name ??
                                                    item.name ??
                                                    `Teacher ${item.id}`}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="font-semibold">

                                        Day

                                    </label>

                                    <select
                                        value={form.day_of_week}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                day_of_week:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    >

                                        <option value="">
                                            Select Day
                                        </option>

                                        {DAYS.map((day) => (

                                            <option
                                                key={day}
                                                value={day}
                                            >

                                                {day}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="font-semibold">

                                        Room

                                    </label>

                                    <input
                                        type="text"
                                        value={form.room}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                room: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        placeholder="e.g. Science Lab"
                                    />

                                </div>

                                <div>

                                    <label className="font-semibold">

                                        Start Time

                                    </label>

                                    <input
                                        type="time"
                                        value={form.start_time}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                start_time:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    />

                                </div>

                                <div>

                                    <label className="font-semibold">

                                        End Time

                                    </label>

                                    <input
                                        type="time"
                                        value={form.end_time}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                end_time:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-lg px-4 py-2 mt-1"
                                        required
                                    />

                                </div>

                            </div>

                            <div className="flex items-center gap-3">

                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_active:
                                                e.target.checked,
                                        })
                                    }
                                />

                                <span className="font-semibold">

                                    Active Timetable

                                </span>

                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                                >

                                    Cancel

                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                                >

                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update Timetable"
                                        : "Save Timetable"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}
