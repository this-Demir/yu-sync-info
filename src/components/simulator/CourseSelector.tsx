import { useState, useMemo } from "react";
import { Search, Plus, Trash2, PlayCircle, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { useSimulationStore, type CourseData } from "../../store/useSimulationStore";
import allCoursesData from "../../data/yu_sync_test_courses.json";
import type { Section } from "../../core/types";

// Generate unique departments from the course codes (e.g. "ADLM 1002" -> "ADLM")
const departments = Array.from(new Set((allCoursesData as CourseData[]).map(c => c.courseCode.split(" ")[0]))).sort();

export default function CourseSelector() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDept, setSelectedDept] = useState<string>("ALL");
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    // Connect to Zustand
    const selectedCourses = useSimulationStore(state => state.selectedCourses);
    const addCourse = useSimulationStore(state => state.addCourse);
    const removeCourse = useSimulationStore(state => state.removeCourse);
    const initializeSimulation = useSimulationStore(state => state.initializeSimulation);

    // Filter logic: Match YU-Sync parity with search + department + allowing cross-semester selection
    const availableCourses = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        let filtered = (allCoursesData as CourseData[]).filter(c =>
            !selectedCourses.some(sc => sc.courseCode === c.courseCode)
        );

        if (selectedDept !== "ALL") {
            filtered = filtered.filter(c => c.courseCode.startsWith(selectedDept));
        }

        if (query) {
            filtered = filtered.filter(c =>
                c.courseCode.toLowerCase().includes(query) ||
                (c.courseName && c.courseName.toLowerCase().includes(query))
            );
        }

        // Show all results that match, prioritizing exact matches if we wanted to
        return filtered.slice(0, 100);
    }, [searchQuery, selectedDept, selectedCourses]);

    const toggleExpand = (courseCode: string) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseCode)) next.delete(courseCode);
            else next.add(courseCode);
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200">
            {/* Header / Pool Area */}
            <div className="p-4 border-b border-slate-800 shrink-0 bg-slate-900/90 z-10 sticky top-0 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Simulation Pool</h2>
                    {selectedCourses.length > 0 && (
                        <button
                            onClick={initializeSimulation}
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors text-[10px] uppercase font-bold tracking-wider shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <PlayCircle size={14} />
                            <span>Run Engine</span>
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search courses (e.g. MATH 101)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600 shadow-inner"
                    />
                </div>

                {/* Department Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                    <Filter size={12} className="text-slate-500 shrink-0" />
                    <button
                        onClick={() => setSelectedDept("ALL")}
                        className={`px-2 py-0.5 rounded text-[10px] shrink-0 font-bold transition-colors ${selectedDept === "ALL" ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        ALL
                    </button>
                    {departments.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-2 py-0.5 rounded text-[10px] shrink-0 font-mono transition-colors ${selectedDept === dept ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2 space-y-6">

                {/* Selected Courses Section */}
                {selectedCourses.length > 0 && (
                    <div className="space-y-2">
                        <div className="px-2 text-[10px] font-bold text-indigo-400 tracking-widest uppercase border-b border-indigo-500/20 pb-1">
                            Selected Courses ({selectedCourses.length})
                        </div>
                        <div className="space-y-1">
                            {selectedCourses.map(course => (
                                <div key={course.courseCode} className="flex flex-col rounded-lg bg-indigo-950/30 border border-indigo-500/30 overflow-hidden">
                                    <div className="flex items-center justify-between p-2 hover:bg-indigo-900/40 transition-colors group cursor-pointer" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-2">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-indigo-400" /> : <ChevronRight size={14} className="text-indigo-600" />}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-indigo-300">{course.courseCode}</span>
                                                <span className="text-[9px] text-indigo-400/60 truncate max-w-[150px]">{course.sections.length} sections included</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCourse(course.courseCode); }}
                                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-50 group-hover:opacity-100"
                                            title="Remove Course"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Expanded Sections View */}
                                    {expandedCourses.has(course.courseCode) && (
                                        <div className="bg-slate-950/50 p-2 space-y-1 border-t border-indigo-500/20">
                                            {course.sections.map((sec: Section) => (
                                                <div key={sec.sectionNo} className="text-[10px] text-slate-400 flex items-center justify-between pl-6 py-1 border-b border-slate-800/50 last:border-0 hover:text-slate-300">
                                                    <span className="font-mono">Sec {sec.sectionNo}</span>
                                                    <span className="text-slate-500 px-1 bg-slate-900 rounded">{sec.days.length} days</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Courses Search Results */}
                <div className="space-y-2">
                    <div className="px-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase border-b border-slate-800 pb-1 flex justify-between">
                        <span>Available Courses</span>
                        <span>{availableCourses.length} results</span>
                    </div>
                    {availableCourses.length === 0 ? (
                        <div className="text-xs text-slate-600 px-2 py-8 text-center bg-slate-950 rounded-lg border border-dashed border-slate-800">
                            No courses found matching criteria.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {availableCourses.map(course => (
                                <div key={course.courseCode} className="flex flex-col rounded-lg bg-transparent border border-transparent hover:border-slate-800 overflow-hidden transition-colors">
                                    <div className="flex items-center justify-between p-2 hover:bg-slate-800/50 group cursor-pointer" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-2">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-600" />}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{course.courseCode}</span>
                                                <span className="text-[9px] text-slate-500 truncate max-w-[150px]">{course.sections.length} sect</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addCourse(course); }}
                                            className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                                            title="Add Course"
                                        >
                                            <Plus size={14} />
                                            <span className="text-[10px] font-bold uppercase">Add</span>
                                        </button>
                                    </div>

                                    {/* Expanded Sections View for Available Courses */}
                                    {expandedCourses.has(course.courseCode) && (
                                        <div className="bg-slate-950 p-2 space-y-1 border-t border-slate-800/50">
                                            {course.sections.map((sec: Section) => (
                                                <div key={sec.sectionNo} className="text-[10px] text-slate-400 flex items-center justify-between pl-6 py-1 border-b border-slate-900 last:border-0 hover:text-slate-300">
                                                    <span className="font-mono">Sec {sec.sectionNo}</span>
                                                    <span className="text-slate-500 px-1 bg-slate-900 rounded">{sec.days.map(d => d.day.substring(0, 3).toUpperCase()).join(", ")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
