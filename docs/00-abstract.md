# 0. Abstract

University timetabling, in which rooms, instructors, periods and student groups
are assigned together, is a long-studied and computationally hard family of
problems [1], [6]. The scheduler studied here does not solve that family. It
solves a narrower problem, which this work calls **Section Selection**. The
sections of each course have already been given fixed meeting times by the
institution, and the task is to choose exactly one section per course so that no
two chosen sections overlap in time.

This document defines Section Selection formally, proves it NP-complete by
reduction from graph 3-colouring, presents the depth-first search with bitmask
conflict detection that the YU-Sync engine implements, proves the algorithm
sound and complete, analyses its cost, and evaluates it empirically on
reproducible random instances.

The narrowing is deliberate and the resulting claim is correspondingly narrow.
A bounded result that is proved is more useful than a broad result that is
asserted.

## Contributions

1. **A formal definition.** Section Selection is stated as a decision problem in
   [Section 2](./02-problem-formulation.md), including the *ghost section*
   exemption that the deployed engine implements and that the previous
   documentation did not mention.

2. **A hardness proof.** [Section 3](./03-complexity.md) proves Section
   Selection NP-complete. Membership in NP is shown by a linear certificate.
   Hardness is shown by a polynomial reduction from 3-colouring [4], with the
   equivalence proved in both directions.

3. **Correctness proofs.** [Section 4](./04-algorithm.md) proves the engine
   sound and complete by way of a loop invariant, and states precisely the
   conditions under which completeness holds. The deployed engine imposes
   resource cutoffs that break completeness by design, and the proof is stated
   for the algorithm without them.

4. **A corrected complexity analysis.** The cost of one conflict check is
   constant only for a fixed slot universe. For a universe of $|T|$ slots on a
   machine with $w$-bit words it is $\Theta(|T|/w)$, which is a constant-factor
   improvement over slot-wise scanning and not a change of complexity class.
   [Experiment 3](./06-evaluation.md#experiment-3) measures this directly.

5. **Four reproducible experiments.** [Section 6](./06-evaluation.md) reports
   scaling behaviour, the benefit of pruning against uninformed enumeration, the
   cost of the conflict check as the universe grows, and a constraint density
   phase transition exhibiting the easy-hard-easy pattern described by Cheeseman
   et al. [5]. All structural results are seeded and reproduce exactly.

6. **A mechanically verified equivalence.** The repository maintains two
   independent implementations of the same algorithm. Their equivalence is
   stated as Theorem 6 in [Section 5](./05-implementation.md) and is checked on
   every test run, over solution sets, node counts, prune counts and conflict
   check counts.

## Summary of measured results

| Result | Value | Source |
|---|---|---|
| Cost peak of the phase transition | density $0.109$, $15\,222$ mean nodes | [Experiment 4](./06-evaluation.md#experiment-4) |
| Density at which half of instances remain solvable | $0.097$ | [Experiment 4](./06-evaluation.md#experiment-4) |
| Conflict checks avoided by pruning at $d = 11$ | $99.88\%$ | [Experiment 2](./06-evaluation.md#experiment-2) |
| Fraction of the search tree visited at $d = 14$ | $4.80 \times 10^{-4}$ | [Experiment 1](./06-evaluation.md#experiment-1) |
| Speedup of word-wise over slot-wise checking at $8192$ slots | $28.7\times$ | [Experiment 3](./06-evaluation.md#experiment-3) |
