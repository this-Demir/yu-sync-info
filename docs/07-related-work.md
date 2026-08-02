# 7. Related Work

This section places the study in its literature. It is short by intent. The
contribution here is a proof and a measurement for one narrow problem, not a
survey, and the references are the small set needed to support the specific
claims made.

## 7.1 Timetabling and its complexity

Automated timetabling has been studied continuously since the 1960s. De Werra's
introduction [6] gives the standard framing of the field and the graph-theoretic
formulations that dominate it. In that framing a timetable is an assignment of
meetings to periods subject to availability and capacity constraints, and the
basic feasibility question is a question about edge colouring in bipartite
multigraphs.

The complexity of the general problem was settled by Even, Itai and Shamir [1],
who proved that timetabling is NP-complete even under substantial restrictions,
by reduction from problems about multicommodity flow. Their result concerns the
full problem, in which meetings must be **assigned** to periods.

The present work is downstream of that setting. Section Selection takes the
assignment as already performed by the institution and asks only which of the
offered sections a single student should take. It is a strictly narrower
question, and the hardness proved in
[Section 3](./03-complexity.md) is proved independently rather than inherited
from [1], because a hardness result for a general problem says nothing about a
restriction of it. The reduction in
[Section 3.2](./03-complexity.md#32-the-reduction-from-3-colouring) is
elementary and is presented in full for that reason.

The relationship in the other direction is worth stating plainly. Anything
proved here about Section Selection says nothing about timetabling proper.
The problems share a vocabulary and not much else.

## 7.2 The framework of NP-completeness

The apparatus used in [Section 3](./03-complexity.md) is standard. Cook [3]
established the existence of NP-complete problems and the technique of
polynomial-time reduction. Karp [4] demonstrated the method's reach by reducing
satisfiability to twenty-one combinatorial problems, among them graph
colourability, which supplies the source problem for the reduction here. Garey
and Johnson [2] remains the reference catalogue, and records graph
$k$-colourability as problem GT4, NP-complete for every fixed $k \ge 3$.

No new technique is introduced in this document. The reduction is a
straightforward construction, and its interest lies entirely in establishing
that a specific deployed system solves a problem that is genuinely hard, rather
than one that merely looks hard.

## 7.3 Constraint satisfaction and phase transitions

Section Selection is a binary constraint satisfaction problem, as noted in
[Section 2.1](./02-problem-formulation.md#21-the-decision-problem). Its
variables are courses, its domains are section sets, and its constraints are
pairwise disjointness requirements. The algorithm in
[Section 4](./04-algorithm.md) is chronological backtracking with a consistency
check at each assignment, which is the most basic complete method for such
problems.

Cheeseman, Kanefsky and Taylor [5] observed that for many NP-hard problem
families the difficulty of randomly generated instances is not uniform across
the parameter space. Instances drawn from the underconstrained region are easy
because solutions are abundant, instances from the overconstrained region are
easy because unsatisfiability is quickly proved, and the hard instances
concentrate in a narrow band between the two, near the point where the
probability of solubility passes one half. They named the resulting shape the
easy-hard-easy pattern and connected it to an order parameter of the instance
family.

[Experiment 4](./06-evaluation.md#experiment-4) reproduces that shape for
Section Selection under the random instance family defined in
[Section 6.0](./06-evaluation.md#60-methodology). The measured cost peak lies at
density $0.109$ and the sampled solvability crossover at density $0.097$, close
but not coincident. The experiment establishes that the pattern is present. It
does not test the order-parameter account of [5], and no claim is made about the
asymptotic location of the transition.

The practical reading matters more than the theoretical one for this system. A
real student timetable is a small, sparsely constrained instance from the easy
side of the transition, and the deployed engine is fast because of where its
instances fall, not because the problem admits an efficient method.

## 7.4 What this document does not engage with

Three neighbouring literatures are relevant to anyone extending the work and are
deliberately untouched here.

**Modern constraint solvers.** The baseline in
[Experiment 2](./06-evaluation.md#experiment-2) is uninformed enumeration, which
is the weakest comparison available. Constraint propagation, conflict-driven
learning, restarts and dynamic variable ordering are all absent from the engine
and from the evaluation. The measured advantage of pruning over enumeration says
nothing about how the engine would fare against a competent solver, and no such
comparison is attempted.

**Optimisation over feasible schedules.** Section Selection as posed is a pure
satisfaction problem with no objective function, so every conflict-free
selection is equally good. Preference handling, soft constraints and
multi-objective formulations are a large part of the timetabling literature [6]
and are entirely outside this study.

**Institution-scale scheduling.** The problem here is per student, with the
institutional timetable given. Rooms, instructors, capacities and enrolment
limits do not appear in the model at all. These are recorded in
[Section 8](./08-limitations.md).
