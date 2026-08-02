# 3. Complexity of Section Selection

This section proves that Section Selection is NP-complete. Membership in NP is
established first, then hardness by reduction from graph 3-colouring, which is
NP-complete [4]. The framework of NP-completeness and polynomial reduction is
that of Cook [3] and Garey and Johnson [2], and is used here without
restatement.

Throughout this section $\Gamma = \emptyset$. By Proposition 3 of
[Section 2](./02-problem-formulation.md#22-ghost-sections), ghost sections can
only make instances easier, so proving hardness without them is the stronger
statement.

## 3.1 Membership in NP

> **Theorem 1.** SECTION SELECTION is in NP.

*Proof.* Take as certificate the selection $\sigma$ itself, presented as a list
of $d$ pairs $(c, \sigma(c))$. Each pair is an index into the instance, so the
certificate has size $O(d \log \|I\|)$, which is polynomial in the instance
size $\|I\|$ defined in
[Section 2.5](./02-problem-formulation.md#25-instance-size).

The verifier performs two checks.

1. **Well-formedness.** Confirm that exactly one pair is present for each
   $c \in C$ and that $\sigma(c) \in S(c)$. Sorting the pairs by course and
   scanning takes $O(d \log d)$ comparisons.

2. **Conflict-freedom.** For each of the $\binom{d}{2}$ unordered pairs of
   distinct courses, test whether $\mu(\sigma(c)) \cap \mu(\sigma(c')) = \emptyset$.
   Under the bitmask encoding this is a conjunction over
   $\lceil |T| / w \rceil$ words by Proposition 1, so each test costs
   $O(|T| / w)$ and the whole check costs $O(d^{2} |T| / w)$.

The verifier accepts if and only if both checks pass. Total running time is
$O(d \log d + d^{2}|T|/w)$, polynomial in $\|I\|$.

Every conflict-free selection is accepted, since it satisfies both checks by
definition. Every accepted certificate is a conflict-free selection, since check
1 forces it to be a selection and check 2 forces every pair to be disjoint.
Hence the instance is satisfiable if and only if some certificate is accepted,
and SECTION SELECTION is in NP. $\blacksquare$

## 3.2 The reduction from 3-colouring

Recall the source problem.

> **3-COLOURING.** Given an undirected simple graph $G = (V, E)$, does there
> exist $\chi : V \to \{1, 2, 3\}$ such that $\chi(u) \neq \chi(v)$ for every
> edge $uv \in E$?

3-COLOURING is NP-complete. Graph colourability appears among the problems shown
NP-complete by Karp [4], and is catalogued as problem GT4 in Garey and
Johnson [2], where it is recorded as remaining NP-complete for every fixed
$k \ge 3$.

### The construction

Given $G = (V, E)$, build an instance $I(G)$ of SECTION SELECTION as follows.

**Slots.** One slot for each pair of an edge and a colour,

$$T \;=\; \{\, t_{e,k} \;:\; e \in E,\ k \in \{1,2,3\} \,\}, \qquad |T| = 3|E| .$$

**Courses.** One course per vertex, $C = \{\, c_v : v \in V \,\}$, so $d = |V|$.

**Sections.** Three sections per course, one per colour,

$$S(c_v) \;=\; \{\, s_{v,1},\ s_{v,2},\ s_{v,3} \,\}, \qquad b_c = 3 .$$

**Masks.** Section $s_{v,k}$ occupies the colour-$k$ slot of every edge incident
to $v$,

$$\mu(s_{v,k}) \;=\; \{\, t_{e,k} \;:\; e \in E,\ v \in e \,\} .$$

The reading is direct. Choosing section $s_{v,k}$ means colouring $v$ with
colour $k$, and doing so claims colour $k$ along every edge at $v$. Two
endpoints of an edge that claim the same colour on that edge collide.

### Cost of the construction

> **Lemma 1.** $I(G)$ is computable from $G$ in time polynomial in $|V| + |E|$.

*Proof.* The slot universe has $3|E|$ elements and is enumerated directly. There
are $|V|$ courses and $3|V|$ sections. The total mask size is

$$\sum_{v \in V} \sum_{k=1}^{3} |\mu(s_{v,k})|
\;=\; \sum_{v \in V} 3 \deg(v)
\;=\; 3 \cdot 2|E| \;=\; 6|E| ,$$

using the handshake identity $\sum_v \deg(v) = 2|E|$. Every component is thus
linear in $|V| + |E|$, and each is produced by a single pass over the vertex and
edge lists. $\blacksquare$

### Correctness of the construction

> **Lemma 2 (colouring to selection).** If $G$ has a proper 3-colouring then
> $I(G)$ is satisfiable.

*Proof.* Let $\chi$ be a proper 3-colouring. Define the selection
$\sigma(c_v) = s_{v, \chi(v)}$, which is well formed since
$\chi(v) \in \{1,2,3\}$ and $S(c_v)$ contains a section for each colour.

Take distinct vertices $u \neq v$ and suppose some slot lies in both masks,

$$t_{e,k} \in \mu(s_{u,\chi(u)}) \cap \mu(s_{v,\chi(v)}) .$$

Membership in the first mask forces $k = \chi(u)$ and $u \in e$. Membership in
the second forces $k = \chi(v)$ and $v \in e$. Hence $\chi(u) = \chi(v) = k$,
and $e$ is an edge containing both $u$ and $v$. Since $G$ is simple and
$u \neq v$, the only such edge is $e = uv$, so $uv \in E$. But $\chi$ is proper
and $uv \in E$ gives $\chi(u) \neq \chi(v)$, a contradiction.

No such slot exists, so the masks are disjoint for every pair of distinct
courses and $\sigma$ is conflict-free. $\blacksquare$

> **Lemma 3 (selection to colouring).** If $I(G)$ is satisfiable then $G$ has a
> proper 3-colouring.

*Proof.* Let $\sigma$ be a conflict-free selection. Every course $c_v$ receives
some section $s_{v,k}$ with $k \in \{1,2,3\}$, so setting $\chi(v) = k$ for that
$k$ defines a total function $\chi : V \to \{1,2,3\}$.

Suppose $\chi$ is not proper. Then there is an edge $uv \in E$ with
$\chi(u) = \chi(v) = k$. Since $u \in uv$, the definition of the masks gives
$t_{uv,k} \in \mu(s_{u,k}) = \mu(\sigma(c_u))$, and since $v \in uv$ likewise
$t_{uv,k} \in \mu(s_{v,k}) = \mu(\sigma(c_v))$. The two masks therefore share
the slot $t_{uv,k}$, so

$$\mu(\sigma(c_u)) \cap \mu(\sigma(c_v)) \neq \emptyset ,$$

contradicting conflict-freedom of $\sigma$, as $u \neq v$ implies
$c_u \neq c_v$.

Hence $\chi$ is proper. $\blacksquare$

> **Theorem 2.** SECTION SELECTION is NP-hard.

*Proof.* Lemma 1 gives a polynomial-time map $G \mapsto I(G)$. Lemmas 2 and 3
together give
$$G \text{ is 3-colourable} \iff I(G) \text{ is satisfiable} .$$
This is a polynomial-time many-one reduction from 3-COLOURING, which is
NP-complete [4]. Therefore SECTION SELECTION is NP-hard. $\blacksquare$

> **Theorem 3.** SECTION SELECTION is NP-complete.

*Proof.* Immediate from Theorem 1 and Theorem 2. $\blacksquare$

> **Corollary 1.** SECTION SELECTION WITH GHOSTS is NP-complete.

*Proof.* Hardness follows from Theorem 2, since the instances $I(G)$ with
$\Gamma = \emptyset$ are instances of the ghost problem by Proposition 2.
Membership in NP follows by the argument of Theorem 1 with the verifier's second
check restricted to pairs of non-ghost sections, which is a weaker condition and
no more costly. $\blacksquare$

## 3.3 A worked reduction

Take $G = K_3$, the triangle on $V = \{1,2,3\}$ with
$E = \{\,e_{12},\ e_{13},\ e_{23}\,\}$. Then $|T| = 3 \cdot 3 = 9$. Index the
slots as $t_{e,k}$ with edges in the order $e_{12}, e_{13}, e_{23}$ and colours
$1,2,3$, so that slot index $= 3 \cdot (\text{edge index}) + (k - 1)$.

| Slot index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Slot | $t_{12,1}$ | $t_{12,2}$ | $t_{12,3}$ | $t_{13,1}$ | $t_{13,2}$ | $t_{13,3}$ | $t_{23,1}$ | $t_{23,2}$ | $t_{23,3}$ |

Vertex 1 lies on $e_{12}$ and $e_{13}$, vertex 2 on $e_{12}$ and $e_{23}$, and
vertex 3 on $e_{13}$ and $e_{23}$. The resulting nine sections are as follows,
with $\beta$ the integer encoding of
[Section 1.3](./01-preliminaries.md#13-the-bitmask-encoding).

| Section | Meaning | Mask | $\beta$ |
|---|---|---|---|
| $s_{1,1}$ | vertex 1, colour 1 | $\{t_{12,1}, t_{13,1}\}$ | 9 |
| $s_{1,2}$ | vertex 1, colour 2 | $\{t_{12,2}, t_{13,2}\}$ | 18 |
| $s_{1,3}$ | vertex 1, colour 3 | $\{t_{12,3}, t_{13,3}\}$ | 36 |
| $s_{2,1}$ | vertex 2, colour 1 | $\{t_{12,1}, t_{23,1}\}$ | 65 |
| $s_{2,2}$ | vertex 2, colour 2 | $\{t_{12,2}, t_{23,2}\}$ | 130 |
| $s_{2,3}$ | vertex 2, colour 3 | $\{t_{12,3}, t_{23,3}\}$ | 260 |
| $s_{3,1}$ | vertex 3, colour 1 | $\{t_{13,1}, t_{23,1}\}$ | 72 |
| $s_{3,2}$ | vertex 3, colour 2 | $\{t_{13,2}, t_{23,2}\}$ | 144 |
| $s_{3,3}$ | vertex 3, colour 3 | $\{t_{13,3}, t_{23,3}\}$ | 288 |

**A proper colouring.** Take $\chi(1) = 1$, $\chi(2) = 2$, $\chi(3) = 3$, giving
the selection $\{s_{1,1}, s_{2,2}, s_{3,3}\}$ with encodings $9$, $130$ and
$288$. The three pairwise conjunctions are

$$9 \wedge 130 = 0, \qquad 9 \wedge 288 = 0, \qquad 130 \wedge 288 = 0 ,$$

so the selection is conflict-free, as Lemma 2 predicts.

**An improper colouring.** Take $\chi(1) = 1$, $\chi(2) = 1$, $\chi(3) = 2$,
giving $\{s_{1,1}, s_{2,1}, s_{3,2}\}$ with encodings $9$, $65$ and $144$. Here

$$9 \wedge 65 = 1 \neq 0 ,$$

and bit $0$ is slot $t_{12,1}$. Vertices 1 and 2 are adjacent and both claim
colour 1, so they collide on exactly the slot the construction created for that
purpose, as Lemma 3 predicts.

**Figure 3.1.** The same reduction in slot-occupancy form. A hash marks an
occupied slot.

```
slot index          0    1    2    3    4    5    6    7    8
slot            t12,1 t12,2 t12,3 t13,1 t13,2 t13,3 t23,1 t23,2 t23,3

proper colouring  chi(1)=1, chi(2)=2, chi(3)=3
s(1,1)              #    .    .    #    .    .    .    .    .
s(2,2)              .    #    .    .    .    .    .    #    .
s(3,3)              .    .    .    .    .    #    .    .    #
                   ---------------------------------------------
overlap             .    .    .    .    .    .    .    .    .    none

improper colouring  chi(1)=1, chi(2)=1, chi(3)=2
s(1,1)              #    .    .    #    .    .    .    .    .
s(2,1)              #    .    .    .    .    .    #    .    .
s(3,2)              .    .    .    .    #    .    .    #    .
                   ---------------------------------------------
overlap             X    .    .    .    .    .    .    .    .    conflict at t12,1
```

An unsatisfiable example is obtained from $K_4$, which has $|E| = 6$ and
therefore $|T| = 18$. $K_4$ is not 3-colourable, so by Lemma 2 and Lemma 3 the
instance $I(K_4)$ has no conflict-free selection, and the engine will exhaust
all $3^{4} = 81$ selections without reporting one.

> Run this live. The **Reduction Explorer** on the application's Docs page lets
> you edit a small graph, watch $I(G)$ being constructed edge by edge, and move
> a candidate colouring while the induced masks are tested. It builds the
> instance with the construction above and evaluates it with the shipped engine.

## 3.4 What the bitmask encoding does not change

The encoding of [Section 1.3](./01-preliminaries.md#13-the-bitmask-encoding)
represents a mask compactly and reduces an overlap test to a conjunction of
machine words. It does not affect the classification above.

> **Proposition 4.** The bitmask encoding changes neither membership in NP nor
> NP-hardness.

*Proof.* For membership, the verifier of Theorem 1 already uses the bitmask
representation and runs in polynomial time. Replacing it with an explicit set
representation changes the cost of each pairwise test from $O(|T|/w)$ to
$O(|T|)$, which is still polynomial, so membership is unaffected in either
direction.

For hardness, the reduction of Theorem 2 constructs masks as sets. Encoding each
as $\lceil 3|E| / w \rceil$ words takes time linear in the total mask size, so
the composed map remains polynomial. The instance produced is the same instance
under a different representation, so satisfiability is unchanged.
$\blacksquare$

The encoding therefore improves the constant factor of the conflict test, and
nothing else. The search space is unchanged and remains of size
$\prod_{c} b_c$. This is measured directly in
[Experiment 3](./06-evaluation.md#experiment-3), which finds a speedup
approaching but not exceeding the word size while both variants remain linear in
$|T|$.

## 3.5 The fixed universe caveat

Theorem 3 concerns the general problem, in which the slot universe is part of
the input and may be arbitrarily large. The deployed configuration does not
satisfy that condition. It fixes $|T| = |D| \cdot |P| = 7 \cdot 12 = 84$. The
difference is not cosmetic.

> **Proposition 5.** For any fixed constant $\tau$, the restriction of SECTION
> SELECTION to instances with $|T| \le \tau$ is solvable in polynomial time.

*Proof.* Let $I$ be such an instance. Partition the courses into

$$C_0 = \{\, c \in C : \text{some } s \in S(c) \text{ has } \mu(s) = \emptyset \,\},
\qquad C_1 = C \setminus C_0 .$$

For a course in $C_0$, choosing a section with an empty mask can never create a
conflict, and doing so is never worse than any other choice, since removing
slots from a selection cannot turn a conflict-free selection into a conflicting
one. Fix such a section for every $c \in C_0$.

Every course in $C_1$ has all of its sections with non-empty masks, so in any
conflict-free selection each contributes at least one slot, and those
contributions are pairwise disjoint subsets of $T$. Hence

$$|C_1| \;\le\; \sum_{c \in C_1} |\mu(\sigma(c))| \;\le\; |T| \;\le\; \tau .$$

If $|C_1| > \tau$ the instance is unsatisfiable and the algorithm reports so.
Otherwise enumerate all $\prod_{c \in C_1} b_c \le b^{\tau}$ combinations over
$C_1$ and test each. Since $b \le \|I\|$ and $\tau$ is constant, $b^{\tau}$ is
bounded by a polynomial in $\|I\|$ of fixed degree $\tau$, and each test costs
$O(\tau^{2} \cdot \tau)$. The total is polynomial. $\blacksquare$

The polynomial has degree $84$ for the deployed configuration, so Proposition 5
is of no practical use whatsoever. It matters only for what may honestly be
claimed. The correct statement is that Section Selection is NP-complete as a
general problem, and that the deployed instance family, having a fixed slot
universe, is not itself NP-hard. The exponential search the engine performs is
justified by the size of the constant in Proposition 5, not by hardness of the
deployed restriction.

This distinction is carried into [Section 8](./08-limitations.md).
