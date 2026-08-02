# 8. Limitations

This section states what the work does not establish. Every item is a real
boundary on the claims made elsewhere in this document, and each is placed
against the specific claim it bounds.

## 8.1 The problem is narrow

YU-Sync does not solve the University Course Timetabling Problem. It solves
Section Selection, in which the meeting times of every section are fixed inputs
and the only decision is which section of each course to take.

The following are absent from the model entirely.

| Absent | Consequence |
|---|---|
| Rooms and capacities | A returned schedule may assign a student to a section that is full |
| Instructors | Instructor availability and load are not represented |
| Enrolment and prerequisites | Eligibility is assumed and never checked |
| Cross-student coordination | Each student is solved independently, with no global feasibility |
| Exam periods | Only weekly teaching meetings are modelled |

Anything proved in [Section 3](./03-complexity.md) or
[Section 4](./04-algorithm.md) is a statement about Section Selection and about
nothing larger. The relationship to the timetabling literature is discussed in
[Section 7.1](./07-related-work.md#71-timetabling-and-its-complexity).

## 8.2 Hardness does not apply to the deployed configuration

Theorem 3 proves Section Selection NP-complete when the slot universe is part of
the input. The deployed system fixes it at $|T| = 7 \times 12 = 84$.

Proposition 5 in
[Section 3.5](./03-complexity.md#35-the-fixed-universe-caveat) shows that for
any fixed slot universe the problem is solvable in polynomial time. The
polynomial has degree $|T|$, so the result is of no practical use, but it means
the honest statement is bounded in a specific way.

> Section Selection is NP-complete as a general problem. The deployed instance
> family, having a fixed slot universe, is not itself NP-hard.

The exponential search the engine performs is justified by the size of the
constant in Proposition 5, and not by hardness of the restriction it actually
faces. Any claim that the deployed scheduler "solves an NP-complete problem"
requires that qualification to be attached.

## 8.3 The conflict check is not constant time in general

[Experiment 3](./06-evaluation.md#experiment-3) measures the conflict check as
$\Theta(|T|/w)$, with a measured cost of about $0.80$ ns per 32-bit word at
large universes. It is genuinely $O(1)$ only when $|T|$ is fixed, which holds
for the deployed configuration and does not hold for the problem in general.

The bitmask encoding buys a constant factor approaching the machine word size,
measured at $29.0\times$ at 8192 slots against a theoretical ceiling of 32. It
does not change the complexity class, as Proposition 4 establishes.

## 8.4 The worst case remains exponential

[Experiment 1](./06-evaluation.md#experiment-1) measures an effective branching
factor of about 2.13 against an unpruned factor of 4. Pruning changes the base
of the exponential. It does not remove it, and by Theorem 3 no method can,
unless $\mathrm{P} = \mathrm{NP}$.

Practical speed comes from the instances being small and sparsely constrained.
[Experiment 4](./06-evaluation.md#experiment-4) shows that instances near the
critical density at $\rho = 0.109$ cost $761$ times more to decide than
instances at the overconstrained extreme and $296$ times more than instances at
the underconstrained extreme, at only twelve courses. A student with an unusually
constrained course list will encounter the hard region, and the deployed cutoffs
will fire before the search completes.

## 8.5 Completeness holds only for the unbounded algorithm

Theorem 5 assumes no result bound and no resource cutoff. The deployed engine
imposes four, listed in
[Section 4.4](./04-algorithm.md#the-cutoffs-break-completeness-by-design).

The practical consequence is precise and worth stating on its own.

> An empty result from the deployed engine is not a proof that no conflict-free
> schedule exists.

The state-space estimate cutoff is the sharpest case. It returns an empty result
before performing any search at all, and that empty result is indistinguishable
at the call site from a completed search that found nothing.

## 8.6 Ghost sections weaken what a returned schedule means

The `isRetake` mechanism, modelled as $\Gamma$ in
[Section 2.2](./02-problem-formulation.md#22-ghost-sections), exempts a section
from all conflict testing. Theorem 4 is correspondingly weaker than it appears.

> A returned schedule is conflict-free **restricted to non-ghost sections**. Two
> ghost sections, or a ghost and a real section, may overlap arbitrarily.

For $\Gamma = \emptyset$ the ordinary reading is recovered by Proposition 2. Any
statement that the engine returns non-overlapping timetables is true only under
that condition.

## 8.7 Engine parity is tested, not proved

Theorem 6 is established by execution over four scenarios, not by any argument
over the source of the two engines. It is a regression barrier with a scope of
exactly those four inputs.

The risk it guards against is real and structural. The two engines share no
helper functions. Each defines its own normalisation, mask construction,
population count, fit test and placement, and
[`app/src/core/scheduler.ts`](../app/src/core/scheduler.ts) hardcodes its own
copy of the period list rather than importing the shared definition. A
correction applied to one file has no effect on the other, and only the test
would notice.

Proving equivalence for all inputs would require either a shared implementation
or a proof over both sources. Neither is attempted here.

## 8.8 The experiments use synthetic instances

The random family defined in
[Section 6.0](./06-evaluation.md#60-methodology) places one two-period meeting
per section, drawn uniformly from a shuffled pool of placements. Real timetables
are structured. Meetings recur in patterns, departments cluster their offerings,
and section times within a course are often deliberately spread to avoid exactly
the conflicts modelled here as random.

There is no claim that real instances are distributed like these. The location
of the phase transition is a property of this family at $d = 12$ and $b = 4$ and
would move under other parameters. What is claimed is the presence and shape of
the easy-hard-easy pattern, which is robust across many families [5].

The bundled course data in
[`app/src/data/yu_sync_test_courses.json`](../app/src/data/yu_sync_test_courses.json)
is real, and is used by the parity test, but it is a single fixed dataset and
supports no distributional claim.

## 8.9 Sample sizes and statistical treatment

Experiment 1 uses ten instances per point and Experiment 2 uses five. Both
series are visibly noisy, and Experiment 1 is non-monotonic at $d = 13$. No
confidence intervals are computed anywhere in this document, no variance is
reported, and no significance test is performed. The effective branching factor
of 2.13 is a geometric mean of measured ratios and not a fitted model.

Conclusions are drawn only from effects that span orders of magnitude, where
this level of treatment is adequate. Any finer comparison would need a proper
statistical design.

## 8.10 Measurements are from one machine and one runtime

All timings come from the single environment recorded in
[`data/environment.json`](./data/environment.json), running under a JavaScript
just-in-time compiler. Absolute nanosecond and millisecond values are not
portable. Structural results, which is every claim this document actually rests
on, are hardware independent and reproduce byte for byte from the recorded
seeds.

## 8.11 Future work

The following would extend the study in the directions its limitations point.

- **Room and instructor constraints.** Adding capacity would move the problem
  closer to timetabling proper and would invalidate the pairwise formulation of
  [Section 2.1](./02-problem-formulation.md#21-the-decision-problem), since
  capacity is not a binary constraint.
- **Soft preferences.** Turning satisfaction into optimisation over the feasible
  set, which requires an objective function the current model does not have.
- **A stronger baseline.** Comparing against a constraint solver with
  propagation and learning, which would replace the weakest-possible comparison
  in [Experiment 2](./06-evaluation.md#experiment-2).
- **An allocation-free traversal.** Mutating the week mask and undoing on
  backtrack, reducing live memory from $O(d|D| + d^{2})$ to $O(d + |D|)$, as
  discussed in
  [Section 5.2](./05-implementation.md#52-allocation-behaviour).
- **A single shared engine.** Deriving the visualizer's step stream from the
  production engine rather than from a parallel implementation, which would turn
  Theorem 6 from a tested property into a structural one.
