# 9. References

References follow the **IEEE** citation style and are cited in text by bracketed
number. Every entry below was included only after its authors, venue, year and
identifier were confirmed against the publisher record. Entries that could not
be confirmed were not added.

---

[1] S. Even, A. Itai, and A. Shamir, "On the complexity of timetable and
multicommodity flow problems," *SIAM Journal on Computing*, vol. 5, no. 4,
pp. 691–703, Dec. 1976, doi: [10.1137/0205048](https://doi.org/10.1137/0205048).

[2] M. R. Garey and D. S. Johnson, *Computers and Intractability, A Guide to the
Theory of NP-Completeness*. San Francisco, CA, USA: W. H. Freeman, 1979.

[3] S. A. Cook, "The complexity of theorem proving procedures," in *Proc. 3rd
Annu. ACM Symp. Theory of Computing (STOC '71)*, Shaker Heights, OH, USA, 1971,
pp. 151–158, doi:
[10.1145/800157.805047](https://doi.org/10.1145/800157.805047).

[4] R. M. Karp, "Reducibility among combinatorial problems," in *Complexity of
Computer Computations*, R. E. Miller and J. W. Thatcher, Eds. New York, NY, USA:
Plenum Press, 1972, pp. 85–103, doi:
[10.1007/978-1-4684-2001-2_9](https://doi.org/10.1007/978-1-4684-2001-2_9).

[5] P. Cheeseman, B. Kanefsky, and W. M. Taylor, "Where the really hard problems
are," in *Proc. 12th Int. Joint Conf. Artificial Intelligence (IJCAI '91)*,
Sydney, NSW, Australia, 1991, pp. 331–337.

[6] D. de Werra, "An introduction to timetabling," *European Journal of
Operational Research*, vol. 19, no. 2, pp. 151–162, Feb. 1985, doi:
[10.1016/0377-2217(85)90167-5](https://doi.org/10.1016/0377-2217(85)90167-5).

---

## Where each reference is used

| Ref | Used for | Sections |
|---|---|---|
| [1] | NP-completeness of timetabling proper, distinguished from Section Selection | [0](./00-abstract.md), [7.1](./07-related-work.md#71-timetabling-and-its-complexity) |
| [2] | The NP-completeness framework, and the catalogue entry for graph $k$-colourability | [3](./03-complexity.md), [7.2](./07-related-work.md#72-the-framework-of-np-completeness) |
| [3] | Existence of NP-complete problems and the reduction technique | [3](./03-complexity.md), [7.2](./07-related-work.md#72-the-framework-of-np-completeness) |
| [4] | NP-completeness of graph colouring, the source problem of the reduction | [3.2](./03-complexity.md#32-the-reduction-from-3-colouring), [7.2](./07-related-work.md#72-the-framework-of-np-completeness) |
| [5] | The easy-hard-easy pattern framing Experiment 4 | [2.3](./02-problem-formulation.md#23-the-search-problem-the-engine-solves), [6](./06-evaluation.md#experiment-4), [7.3](./07-related-work.md#73-constraint-satisfaction-and-phase-transitions), [8.8](./08-limitations.md#88-the-experiments-use-synthetic-instances) |
| [6] | Standard framing of the timetabling field and its optimisation formulations | [0](./00-abstract.md), [7.1](./07-related-work.md#71-timetabling-and-its-complexity), [7.4](./07-related-work.md#74-what-this-document-does-not-engage-with) |

## A note on citation discipline

Reference [5] is cited for the existence and shape of the easy-hard-easy
pattern, which is what
[Experiment 4](./06-evaluation.md#experiment-4) reproduces. It is **not** cited
for the location of the transition in this instance family, which is a measured
quantity reported without any appeal to the literature, nor for the
order-parameter account of why the pattern arises, which this document does not
test.

Reference [1] is cited for the hardness of timetabling proper. It is **not**
used to support the hardness of Section Selection. A hardness result for a
general problem does not transfer to a restriction of it, which is why
[Section 3](./03-complexity.md) proves the narrower result from first principles
rather than citing [1] for it.
