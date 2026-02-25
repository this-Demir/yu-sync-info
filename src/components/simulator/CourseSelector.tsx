import { useState, useMemo } from "react";
import { Search, Plus, Trash2, PlayCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useSimulationStore, type CourseData } from "../../store/useSimulationStore";
import allCoursesData from "../../data/yu_sync_test_courses.json";
import type { Section } from "../../core/types";

const TEST_SCENARIOS = [
    { label: "Software Eng (Year 2)", note: "Wide branching tree.", codes: ["MATH 2261", "SE 2226", "SE 2228", "SE 2230", "SE 2232"] },
    { label: "Psychology (Year 1)", note: "Standard core, quick resolution.", codes: ["MATH 1114", "PHIL 1100", "PSYC 1020", "PSYC 1102", "SOFL 1102"] },
    { label: "Industrial Eng (Year 1)", note: "Heavy lab blocks.", codes: ["CHEM 1130", "ENGR 1116", "MATH 1132", "SOFL 1102"] },
    { label: "The Chaos Edge Case", note: "Cross-semester collision testing. Heavy backtracking.", codes: ["MATH 1131", "SE 2226", "SE 3332", "SE 4458"] }
];

export default function CourseSelector() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    // Connect to Zustand
    const selectedCourses = useSimulationStore(state => state.selectedCourses);
    const addCourse = useSimulationStore(state => state.addCourse);
    const removeCourse = useSimulationStore(state => state.removeCourse);
    const setCourses = useSimulationStore(state => state.setCourses);
    const initializeSimulation = useSimulationStore(state => state.initializeSimulation);

    const loadScenario = (codes: string[]) => {
        const coursesToLoad = (allCoursesData as CourseData[]).filter(c => codes.includes(c.courseCode));
        setCourses(coursesToLoad);
    };

    // Raw search logic matching YU-Sync parity
    const availableCourses = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        let filtered = (allCoursesData as CourseData[]).filter(c =>
            !selectedCourses.some(sc => sc.courseCode === c.courseCode)
        );

        if (query) {
            filtered = filtered.filter(c =>
                c.courseCode.toLowerCase().includes(query) ||
                (c.courseName && c.courseName.toLowerCase().includes(query))
            );
        }

        return filtered.slice(0, 50); // Keep reasonable limit
    }, [searchQuery, selectedCourses]);

    const toggleExpand = (courseCode: string) => {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseCode)) next.delete(courseCode);
            else next.add(courseCode);
            return next;
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white text-gray-900 font-sans">
            {/* Header / Pool Area */}
            <div className="p-4 border-b border-gray-200 shrink-0 bg-white z-10 sticky top-0">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Simulation Pool</h2>
                    {selectedCourses.length > 0 && (
                        <button
                            onClick={initializeSimulation}
                            className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-2.5 py-1 rounded-md transition-colors text-xs font-medium shadow-sm active:scale-95"
                        >
                            <PlayCircle size={14} />
                            <span>Run Engine</span>
                        </button>
                    )}
                </div>

                {/* Test Scenarios Quick Load */}
                <div className="mb-4">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Test Scenarios</div>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        {TEST_SCENARIOS.map(scen => (
                            <button
                                key={scen.label}
                                onClick={() => loadScenario(scen.codes)}
                                title={scen.note}
                                className="px-2 py-1 bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 text-[10px] font-semibold rounded-md whitespace-nowrap transition-colors"
                            >
                                {scen.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minimal Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search courses (e.g. MATH 101)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-shadow placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                {/* Selected Courses Section */}
                {selectedCourses.length > 0 && (
                    <div className="border-b border-gray-200">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 tracking-wider uppercase">
                            Selected ({selectedCourses.length})
                        </div>
                        <div className="flex flex-col">
                            {selectedCourses.map(course => (
                                <div key={course.courseCode} className="flex flex-col border-b border-gray-100 last:border-b-0 bg-white">
                                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-3">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-300" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{course.courseCode}</span>
                                                <span className="font-mono text-[10px] text-gray-500">{course.sections.length} sections included</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCourse(course.courseCode); }}
                                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Course"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Expanded Sections View */}
                                    {expandedCourses.has(course.courseCode) && (
                                        <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex flex-col gap-1.5">
                                            {course.sections.map((sec: Section) => (
                                                <div key={sec.sectionNo} className="text-xs text-gray-600 flex items-center justify-between pl-7 py-0.5">
                                                    <span className="font-mono text-gray-700 bg-white border border-gray-200 px-1.5 py-px rounded">Sec {sec.sectionNo}</span>
                                                    <span className="font-mono text-gray-500 text-[10px]">{sec.days.length} days</span>
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
                <div className="flex flex-col pb-10">
                    <div className="px-4 py-2 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                        <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Available Courses</span>
                        <span className="font-mono text-[10px] text-gray-400">{availableCourses.length} results</span>
                    </div>
                    {availableCourses.length === 0 ? (
                        <div className="text-sm text-gray-500 px-4 py-12 text-center">
                            No courses match your search.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {availableCourses.map(course => (
                                <div key={course.courseCode} className="flex flex-col border-b border-gray-100 last:border-b-0 bg-white transition-colors">
                                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 group cursor-pointer" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-3">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{course.courseCode}</span>
                                                <span className="font-mono text-[10px] text-gray-500">{course.sections.length} sections</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addCourse(course); }}
                                            className="px-2 py-1 rounded text-[10px] font-semibold uppercase text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-900 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shadow-sm"
                                            title="Add Course"
                                        >
                                            <Plus size={12} />
                                            Add
                                        </button>
                                    </div>

                                    {/* Expanded Sections View for Available Courses */}
                                    {expandedCourses.has(course.courseCode) && (
                                        <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex flex-col gap-1.5">
                                            {course.sections.map((sec: Section) => (
                                                <div key={sec.sectionNo} className="text-xs text-gray-600 flex items-center justify-between pl-7 py-0.5">
                                                    <span className="font-mono text-gray-700 bg-white border border-gray-200 px-1.5 py-px rounded">Sec {sec.sectionNo}</span>
                                                    <span className="font-mono text-gray-500 text-[10px] uppercase">
                                                        {sec.days.map(d => d.day.substring(0, 3)).join(", ")}
                                                    </span>
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
