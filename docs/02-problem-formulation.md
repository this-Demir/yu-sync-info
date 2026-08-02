# 2. Problem Formulation

This section states the problem the engine solves. It is posed as a decision
problem so that the complexity claims in [Section 3](./03-complexity.md) are
well formed. The search variant the deployed system actually runs is stated
afterwards and related back to the decision problem.

Notation follows [Section 1](./01-preliminaries.md).

## 2.1 The decision problem

> **SECTION SELECTION**
>
> **Instance.** A finite slot universe $T$, a finite course set $C$, for each
> $c \in C$ a non-empty finite section set $S(c)$, and for each section
> $s \in S = \bigcup_{c} S(c)$ a mask $\mu(s) \subseteq T$.
>
> **Question.** Does there exist a selection $\sigma : C \to S$ with
> $\sigma(c) \in S(c)$ for every $c$, such that
> $$\mu(\sigma(c)) \cap \mu(\sigma(c')) = \emptyset
> \quad \text{for every pair of distinct } c, c' \in C \ ?$$

A selection satisfying the condition is called **conflict-free**, and an
instance admitting one is **satisfiable**.

Three features of the definition deserve comment.

**Sections are fixed.** Masks are part of the input. The problem is one of
choice among given alternatives, not of assignment of times to activities. This
is what separates it from timetabling proper, discussed in
[Section 7](./07-related-work.md).

**Exactly one section per course.** Not at most one. Every course must be
scheduled, so an instance in which a single course cannot be placed is
unsatisfiable regardless of the rest.

**The constraint is pairwise.** Conflict-freedom is a conjunction of binary
constraints over pairs of distinct courses. Section Selection is therefore a
binary constraint satisfaction problem whose variables are the courses, whose
domains are the section sets, and whose constraints are the disjointness
requirements. Nothing in the formulation requires the constraint graph to be
complete. Two courses whose sections never overlap impose no constraint at all.

## 2.2 Ghost sections

The deployed engine supports a feature the earlier documentation did not
describe. A section may be marked as a **retake**, and such a section is placed
without any conflict test and without occupying any slot. The mechanism exists
because a student repeating a course may attend it outside the ordinary
timetable, so its nominal meeting time should not constrain anything else.

Modelling this honestly requires a second version of the problem.

> **SECTION SELECTION WITH GHOSTS**
>
> **Instance.** As above, together with a distinguished subset
> $\Gamma \subseteq S$ of ghost sections.
>
> **Question.** Does there exist a selection $\sigma$ such that
> $$\mu(\sigma(c)) \cap \mu(\sigma(c')) = \emptyset$$
> for every pair of distinct $c, c' \in C$ with
> $\sigma(c) \notin \Gamma$ and $\sigma(c') \notin \Gamma \ ?$

Write $\mathrm{real}(\sigma) = \{\, \sigma(c) : c \in C,\ \sigma(c) \notin \Gamma \,\}$
for the non-ghost sections a selection chooses. The condition says exactly that
$\mathrm{real}(\sigma)$ is pairwise disjoint. Ghost sections are unconstrained
and constrain nothing.

Two consequences follow immediately and matter for the proofs later.

> **Proposition 2.** If $\Gamma = \emptyset$ then SECTION SELECTION WITH GHOSTS
> and SECTION SELECTION coincide.

*Proof.* With $\Gamma = \emptyset$ the side conditions $\sigma(c) \notin \Gamma$
and $\sigma(c') \notin \Gamma$ hold for every pair, so the two quantified
conditions are literally the same formula. $\blacksquare$

> **Proposition 3.** If every course has at least one ghost section then the
> instance is satisfiable.

*Proof.* Choose $\sigma(c) \in \Gamma \cap S(c)$ for every $c$. Then
$\mathrm{real}(\sigma) = \emptyset$, which is vacuously pairwise disjoint.
$\blacksquare$

Proposition 3 is the reason the hardness proof in
[Section 3](./03-complexity.md) is stated for $\Gamma = \emptyset$. Ghosts can
only make an instance easier, never harder, so a hardness result proved without
them carries over to the general problem, while a hardness result that relied on
them would be vacuous.

Throughout the remainder, an unqualified reference to Section Selection means
the ghost-free problem. Statements that depend on ghosts say so.

## 2.3 The search problem the engine solves

The deployed engine does not answer yes or no. It enumerates conflict-free
selections up to a caller-supplied limit.

> **SECTION SELECTION ENUMERATION**
>
> **Instance.** As in SECTION SELECTION WITH GHOSTS, together with a bound
> $k \in \mathbb{N}$.
>
> **Output.** A set of at most $k$ distinct conflict-free selections, containing
> every conflict-free selection whenever the total number of them is at most $k$.

The decision problem is the case $k = 1$ with the output reduced to whether the
returned set is empty. Every hardness statement about the decision problem
therefore transfers to the enumeration problem, since an algorithm for the
latter with $k = 1$ decides the former.

The distinction is not merely formal. It determines what
[Experiment 4](./06-evaluation.md#experiment-4) measures. That experiment sets
$k = 1$, because the easy-hard-easy phenomenon described by Cheeseman et al. [5]
is a property of deciding satisfiability. An experiment that enumerated all
solutions would instead be measuring the size of the solution set, which grows
without bound as constraints are removed and would obscure the effect entirely.

## 2.4 Objective functions

Section Selection as posed here is a pure satisfaction problem. It has no
objective function, and every conflict-free selection is as good as every other.

Real schedulers are usually asked for more, such as compact days, avoided early
mornings, or preferred instructors. Those turn the problem into an optimisation
problem over the same feasible set. Nothing in this document addresses that
extension, and the engine implements none of it. The consequences are recorded
in [Section 8](./08-limitations.md).

## 2.5 Instance size

For complexity statements, the size of an instance is measured as

$$\|I\| \;=\; |T| \;+\; \sum_{c \in C} b_c \;+\; \sum_{s \in S} |\mu(s)| ,$$

that is, the slot universe, the total number of sections, and the total mask
size. Under the bitmask encoding of
[Section 1.3](./01-preliminaries.md#13-the-bitmask-encoding) a mask occupies
$\lceil |T| / w \rceil$ words, so the encoded size is within a constant factor
of $\|I\|$ for any fixed word size. The two measures are polynomially related
and either may be used in the proofs that follow.
