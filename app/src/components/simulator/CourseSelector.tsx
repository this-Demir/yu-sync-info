import { useState, useMemo } from "react";
import { Search, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useSimulationStore, type CourseData } from "../../store/useSimulationStore";
import allCoursesData from "../../data/yu_sync_test_courses.json";
import type { Section } from "../../core/types";
import { TEST_SCENARIOS } from "./scenarios";
import RunButton from "./RunButton";

export default function CourseSelector() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

    // Connect to Zustand
    const selectedCourses = useSimulationStore(state => state.selectedCourses);
    const addCourse = useSimulationStore(state => state.addCourse);
    const removeCourse = useSimulationStore(state => state.removeCourse);
    const setCourses = useSimulationStore(state => state.setCourses);
    const run = useSimulationStore(state => state.run);

    // A scenario is a demo shortcut, so it loads and starts in one click rather
    // than filling the list and leaving the next step to be discovered.
    const loadScenario = (codes: string[]) => {
        const coursesToLoad = (allCoursesData as CourseData[]).filter(c => codes.includes(c.courseCode));
        setCourses(coursesToLoad);
        run();
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
                {/* The primary action lives in the footer, not here. It used to be
                    this row and was hidden until the pool was non-empty, so a first
                    visit had no call to action anywhere on the page. */}
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Simulation Pool</h2>
                    <span className="font-mono text-[10px] text-gray-400">
                        {selectedCourses.length} selected
                    </span>
                </div>

                {/* Test Scenarios Quick Load */}
                <div className="mb-4">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Test Scenarios</div>
                    <div className="grid grid-cols-2 gap-2">
                        {TEST_SCENARIOS.map(scen => (
                            <button
                                key={scen.label}
                                onClick={() => loadScenario(scen.codes)}
                                className="text-left px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-white rounded-lg transition-colors group"
                            >
                                <p className="text-[11px] font-semibold text-gray-800 leading-tight group-hover:text-gray-900">{scen.label}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{scen.note}</p>
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
            <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto">

                {/* Empty pool state. Without this the Selected block simply does not
                    exist, so the pool concept is invisible until something is in it. */}
                {selectedCourses.length === 0 && (
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 text-center">
                        <p className="text-xs font-semibold text-gray-600">Nothing selected yet</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                            Load a test scenario above, or search below and add courses one at a time.
                        </p>
                    </div>
                )}

                {/* Selected Courses Section */}
                {selectedCourses.length > 0 && (
                    <div className="border-b border-gray-200">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 tracking-wider uppercase">
                            Selected ({selectedCourses.length})
                        </div>
                        <div className="flex flex-col">
                            {selectedCourses.map(course => (
                                <div key={course.courseCode} className="flex flex-col border-b border-gray-100 last:border-b-0 bg-white">
                                    <div className="group flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 lg:py-2" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-3">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-300" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{course.courseCode}</span>
                                                <span className="font-mono text-[10px] text-gray-500">{course.sections.length} sections included</span>
                                            </div>
                                        </div>
                                        {/* Touch has no hover, so the reveal on hover is confined to lg
                                            and up. Without this the control is unreachable on a phone. */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCourse(course.courseCode); }}
                                            className="rounded p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 lg:p-1 lg:opacity-0 lg:group-hover:opacity-100"
                                            title="Remove Course"
                                            aria-label={`Remove ${course.courseCode}`}
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
                                    <div className="group flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50 lg:py-2" onClick={() => toggleExpand(course.courseCode)}>
                                        <div className="flex items-center gap-3">
                                            {expandedCourses.has(course.courseCode) ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-300 transition-colors group-hover:text-gray-500" />}
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{course.courseCode}</span>
                                                <span className="font-mono text-[10px] text-gray-500">{course.sections.length} sections</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addCourse(course); }}
                                            className="flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 lg:px-2 lg:py-1 lg:opacity-0 lg:group-hover:opacity-100"
                                            title="Add Course"
                                            aria-label={`Add ${course.courseCode}`}
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

            {/* The single primary action. This component renders in both the
                desktop sidebar and the mobile Courses pane, so one footer serves
                both layouts. It is always present and states the current state,
                rather than appearing only once the pool is non-empty. */}
            <div className="shrink-0 border-t border-gray-200 bg-white p-3">
                <RunButton />
            </div>
        </div>
    );
}
