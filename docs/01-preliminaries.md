# 1. Preliminaries and Notation

This section fixes the vocabulary used by every later proof. Objects are
defined once here and are not redefined afterwards.

## 1.1 Courses, sections, and the slot universe

Let $T$ be a finite set of **time slots**, called the *slot universe*. A slot is
an atomic, indivisible unit of the timetable. Two activities occupying the same
slot cannot both take place.

Let $C = \{c_1, c_2, \dots, c_d\}$ be a finite set of **courses**, where
$d = |C|$. Each course $c \in C$ offers a non-empty finite set of **sections**
$S(c)$, and these sets are pairwise disjoint. Write

$$S = \bigcup_{c \in C} S(c), \qquad b_c = |S(c)|, \qquad b = \max_{c \in C} b_c .$$

A section is one concrete offering of a course, with meeting times already
fixed by the institution. The scheduler never moves a section. It only chooses
among the sections that exist.

Each section $s \in S$ has a **mask**

$$\mu(s) \subseteq T,$$

the set of slots at which $s$ meets. Masks are given as part of the input and
are never modified.

A distinguished subset $\Gamma \subseteq S$ contains the **ghost sections**.
These are sections that the user has asked to be placed without regard to
conflict, which the deployed system uses for repeated courses that a student
attends outside the normal timetable. Their treatment is made precise in
[Section 2](./02-problem-formulation.md). Where $\Gamma$ is not mentioned, it is
empty.

## 1.2 Overlap

Two sections $s$ and $s'$ **overlap** when they share at least one slot,

$$\mathrm{overlap}(s, s') \iff \mu(s) \cap \mu(s') \neq \emptyset .$$

Overlap is symmetric and irreflexive on distinct sections with non-empty masks.
It is **not** transitive. Sections $s_1$ and $s_2$ may overlap, and $s_2$ and
$s_3$ may overlap, while $s_1$ and $s_3$ are disjoint. Every later argument
treats overlap as a pairwise relation only, and no proof relies on transitivity.

## 1.3 The bitmask encoding

Fix a total order on $T$ and identify $T$ with $\{0, 1, \dots, |T| - 1\}$. A
subset $M \subseteq T$ is represented by the integer

$$\beta(M) \;=\; \sum_{i \in M} 2^{i}.$$

The map $\beta$ is a bijection from subsets of $T$ onto the integers in
$[0, 2^{|T|})$. Under it, set operations become bitwise operations.

$$\beta(M \cap N) = \beta(M) \wedge \beta(N), \qquad
\beta(M \cup N) = \beta(M) \vee \beta(N)$$

where $\wedge$ and $\vee$ are bitwise conjunction and disjunction. The
consequence used throughout is immediate.

> **Proposition 1 (bitmask overlap test).**
> For all $M, N \subseteq T$,
> $$M \cap N \neq \emptyset \iff \beta(M) \wedge \beta(N) \neq 0 .$$

*Proof.* $\beta$ is a bijection with $\beta(\emptyset) = 0$, and
$\beta(M \cap N) = \beta(M) \wedge \beta(N)$. Hence
$\beta(M) \wedge \beta(N) = 0$ if and only if $\beta(M \cap N) = \beta(\emptyset)$,
which by injectivity holds if and only if $M \cap N = \emptyset$. $\blacksquare$

Proposition 1 is what allows an overlap test to be one machine instruction
rather than a loop over slots, provided the masks fit in one machine word. When
they do not, the test is a loop over $\lceil |T| / w \rceil$ words for a word
size $w$. That distinction is the subject of
[Section 4.5](./04-algorithm.md#45-complexity-of-the-search) and is measured in
[Experiment 3](./06-evaluation.md#experiment-3).

## 1.4 The deployed encoding

The implementation factors the slot universe by day. Let $D$ be the set of days
and $P$ the set of periods within a day, so that

$$T \;=\; D \times P, \qquad |T| = |D| \cdot |P| .$$

A mask is then stored as a vector of $|D|$ integers, one per day, each holding
$|P|$ bits. Since two activities on different days can never overlap, the
overlap test decomposes into a disjunction over days,

$$\mu(s) \cap \mu(s') \neq \emptyset
\iff \bigvee_{\delta \in D} \big( \beta_\delta(s) \wedge \beta_\delta(s') \big) \neq 0 ,$$

where $\beta_\delta(s)$ is the period mask of section $s$ on day $\delta$.

In the deployed configuration $|D| = 7$ and $|P| = 12$, with periods beginning
at 08:40 and running hourly to 19:40, so $|T| = 84$. The values are defined in
[`app/src/core/time.ts`](../app/src/core/time.ts).

| Bit | Period start |
|---|---|
| 0 | 08:40 |
| 1 | 09:40 |
| 2 | 10:40 |
| $\vdots$ | $\vdots$ |
| 11 | 19:40 |

Because $|P| = 12 \le w$ for any realistic word size, each day's test is a
single machine-word conjunction and a whole-week test costs at most $|D| = 7$ of
them. The implementation improves on this by iterating only the days on which
the candidate section actually meets, which is one or two days in practice.

### Worked example

Suppose a Monday mask already holds the periods 10:40 and 11:40, and a candidate
section requests 11:40 and 12:40. Writing bit 0 on the right,

$$
\begin{aligned}
\beta_{\text{Mon}}(W) &= 0000\,0000\,1100_2 = 12 \\
\beta_{\text{Mon}}(s) &= 0000\,0001\,1000_2 = 24 \\
\beta_{\text{Mon}}(W) \wedge \beta_{\text{Mon}}(s) &= 0000\,0000\,1000_2 = 8 \neq 0 .
\end{aligned}
$$

The result is non-zero, so by Proposition 1 the two overlap, and they do,
at 11:40.

**Figure 1.1** below is the static counterpart of the interactive bitmask
playground on the application's documentation page. It shows the same two masks
and the conjunction that rejects them.

```
period          08:40 09:40 10:40 11:40 12:40 13:40 14:40 ...
bit index         0     1     2     3     4     5     6

W  (occupied)     .     .     #     #     .     .     .     = 12
s  (candidate)    .     .     .     #     #     .     .     = 24
------------------------------------------------------------------
W AND s           .     .     .     #     .     .     .     =  8   -> overlap
```

Changing the candidate to 12:40 and 13:40 gives
$\beta_{\text{Mon}}(s) = 48$ and $12 \wedge 48 = 0$, so the placement is
accepted.

> Run this live. The **Bitmask Playground** on the application's Docs page lets
> you toggle individual periods on both masks and shows the integers and their
> conjunction updating. It computes the conjunction with the same code path
> described here.

## 1.5 Selections

A **selection** is a function

$$\sigma : C \to S \quad \text{with} \quad \sigma(c) \in S(c) \ \text{for every } c \in C .$$

That is, a selection chooses exactly one section from each course. The number of
selections is

$$\prod_{c \in C} b_c ,$$

which is at most $b^{d}$. A selection is the object the scheduler must produce,
and the set of all selections is the space it searches.

## 1.6 Notation summary

| Symbol | Meaning |
|---|---|
| $T$ | Slot universe, a finite set of atomic time slots |
| $C$, $d$ | Course set and its size |
| $S(c)$, $b_c$ | Sections of course $c$ and their number |
| $S$, $b$ | All sections, and $\max_c b_c$ |
| $\mu(s)$ | Mask of section $s$, a subset of $T$ |
| $\Gamma$ | Ghost sections, exempt from conflict testing |
| $\beta(M)$ | Integer encoding of the slot set $M$ |
| $\sigma$ | A selection, one section per course |
| $D$, $P$ | Days and periods in the deployed factorisation $T = D \times P$ |
| $w$ | Machine word size in bits |
