// GENERATED FILE. Do not edit by hand.
//
// Written by app/scripts/run-experiments.bench.ts on `npm run bench`.
// The Docs page imports these values instead of hardcoding measurements,
// so a number rendered in the browser and the same number printed in
// docs/06-evaluation.md always come from a single run of the experiments.
//
// Structural values are reproducible from the seeds in each `config`.
// Values in nanoseconds or milliseconds are hardware dependent.

export const RESULTS = {
  "environment": {
    "cpu": "13th Gen Intel(R) Core(TM) i9-13900H",
    "logicalCores": 20,
    "totalMemoryGB": 15.7,
    "platform": "Windows_NT 10.0.26200",
    "arch": "x64",
    "runtime": "Node v22.15.1"
  },
  "scaling": {
    "config": {
      "minCourses": 2,
      "maxCourses": 14,
      "sectionsPerCourse": 4,
      "placementPool": 18,
      "instancesPerPoint": 10,
      "baseSeed": 20260801
    },
    "points": [
      {
        "courses": 2,
        "worstCaseNodes": 20,
        "completeAssignments": 16,
        "meanNodes": 20,
        "exploredFraction": 1,
        "meanSolutions": 14.9,
        "meanDensity": 0.06875
      },
      {
        "courses": 3,
        "worstCaseNodes": 84,
        "completeAssignments": 64,
        "meanNodes": 80.8,
        "exploredFraction": 0.9619047619047618,
        "meanSolutions": 50,
        "meanDensity": 0.07708333333333334
      },
      {
        "courses": 4,
        "worstCaseNodes": 340,
        "completeAssignments": 256,
        "meanNodes": 295.6,
        "exploredFraction": 0.8694117647058824,
        "meanSolutions": 156.7,
        "meanDensity": 0.07395833333333332
      },
      {
        "courses": 5,
        "worstCaseNodes": 1364,
        "completeAssignments": 1024,
        "meanNodes": 816,
        "exploredFraction": 0.5982404692082112,
        "meanSolutions": 328.3,
        "meanDensity": 0.103125
      },
      {
        "courses": 6,
        "worstCaseNodes": 5460,
        "completeAssignments": 4096,
        "meanNodes": 2895.2,
        "exploredFraction": 0.5302564102564102,
        "meanSolutions": 1238.8,
        "meanDensity": 0.07125
      },
      {
        "courses": 7,
        "worstCaseNodes": 21844,
        "completeAssignments": 16384,
        "meanNodes": 6854.8,
        "exploredFraction": 0.3138069950558506,
        "meanSolutions": 2290.1,
        "meanDensity": 0.07916666666666668
      },
      {
        "courses": 8,
        "worstCaseNodes": 87380,
        "completeAssignments": 65536,
        "meanNodes": 17593.2,
        "exploredFraction": 0.20134126802471963,
        "meanSolutions": 5233.6,
        "meanDensity": 0.07410714285714286
      },
      {
        "courses": 9,
        "worstCaseNodes": 349524,
        "completeAssignments": 262144,
        "meanNodes": 31747.6,
        "exploredFraction": 0.09083095867522688,
        "meanSolutions": 5980.2,
        "meanDensity": 0.08385416666666666
      },
      {
        "courses": 10,
        "worstCaseNodes": 1398100,
        "completeAssignments": 1048576,
        "meanNodes": 41526,
        "exploredFraction": 0.029701738073099206,
        "meanSolutions": 4295.2,
        "meanDensity": 0.095
      },
      {
        "courses": 11,
        "worstCaseNodes": 5592404,
        "completeAssignments": 4194304,
        "meanNodes": 85243.6,
        "exploredFraction": 0.015242747126280577,
        "meanSolutions": 10093.2,
        "meanDensity": 0.08681818181818182
      },
      {
        "courses": 12,
        "worstCaseNodes": 22369620,
        "completeAssignments": 16777216,
        "meanNodes": 117501.2,
        "exploredFraction": 0.0052527132780977055,
        "meanSolutions": 6803.5,
        "meanDensity": 0.0846590909090909
      },
      {
        "courses": 13,
        "worstCaseNodes": 89478484,
        "completeAssignments": 67108864,
        "meanNodes": 69412,
        "exploredFraction": 0.0007757395621499354,
        "meanSolutions": 1185.3,
        "meanDensity": 0.09142628205128206
      },
      {
        "courses": 14,
        "worstCaseNodes": 357913940,
        "completeAssignments": 268435456,
        "meanNodes": 171894.8,
        "exploredFraction": 0.00048026852488617793,
        "meanSolutions": 5901.8,
        "meanDensity": 0.08550824175824176
      }
    ],
    "effectiveBranchingFactor": 2.1274175059482543
  },
  "pruning": {
    "config": {
      "minCourses": 2,
      "maxCourses": 11,
      "sectionsPerCourse": 4,
      "placementPool": 18,
      "instancesPerPoint": 5,
      "baseSeed": 20260802
    },
    "points": [
      {
        "courses": 2,
        "naiveCombinations": 16,
        "meanNaiveConflictChecks": 16,
        "meanDfsConflictChecks": 20,
        "checkReduction": -0.25,
        "meanSolutions": 15.2,
        "agree": true
      },
      {
        "courses": 3,
        "naiveCombinations": 64,
        "meanNaiveConflictChecks": 179.2,
        "meanDfsConflictChecks": 79.2,
        "checkReduction": 0.5580357142857143,
        "meanSolutions": 52.8,
        "agree": true
      },
      {
        "courses": 4,
        "naiveCombinations": 256,
        "meanNaiveConflictChecks": 1205.6,
        "meanDfsConflictChecks": 268.8,
        "checkReduction": 0.7770404777704047,
        "meanSolutions": 145,
        "agree": true
      },
      {
        "courses": 5,
        "naiveCombinations": 1024,
        "meanNaiveConflictChecks": 8147,
        "meanDfsConflictChecks": 1018.4,
        "checkReduction": 0.8749969313857862,
        "meanSolutions": 466.4,
        "agree": true
      },
      {
        "courses": 6,
        "naiveCombinations": 4096,
        "meanNaiveConflictChecks": 38555.2,
        "meanDfsConflictChecks": 2859.2,
        "checkReduction": 0.9258413910445283,
        "meanSolutions": 1156.6,
        "agree": true
      },
      {
        "courses": 7,
        "naiveCombinations": 16384,
        "meanNaiveConflictChecks": 171259,
        "meanDfsConflictChecks": 7139.2,
        "checkReduction": 0.9583134317028594,
        "meanSolutions": 2702.8,
        "agree": true
      },
      {
        "courses": 8,
        "naiveCombinations": 65536,
        "meanNaiveConflictChecks": 714533.6,
        "meanDfsConflictChecks": 17049.6,
        "checkReduction": 0.9761388407766969,
        "meanSolutions": 5144.2,
        "agree": true
      },
      {
        "courses": 9,
        "naiveCombinations": 262144,
        "meanNaiveConflictChecks": 2790584,
        "meanDfsConflictChecks": 23872.8,
        "checkReduction": 0.9914452315357646,
        "meanSolutions": 4293.6,
        "agree": true
      },
      {
        "courses": 10,
        "naiveCombinations": 1048576,
        "meanNaiveConflictChecks": 11172691.8,
        "meanDfsConflictChecks": 45394.4,
        "checkReduction": 0.995937022088088,
        "meanSolutions": 9269.2,
        "agree": true
      },
      {
        "courses": 11,
        "naiveCombinations": 4194304,
        "meanNaiveConflictChecks": 52899833.6,
        "meanDfsConflictChecks": 66311.2,
        "checkReduction": 0.9987464762081973,
        "meanSolutions": 4228.6,
        "agree": true
      }
    ],
    "allAgree": true
  },
  "microbench": {
    "config": {
      "slotSizes": [
        32,
        64,
        128,
        256,
        512,
        1024,
        2048,
        4096,
        8192
      ],
      "reps": 200000,
      "trials": 7
    },
    "wordBits": 32,
    "deployedWeekNs": 13.898499999995693,
    "points": [
      {
        "slots": 32,
        "words": 1,
        "wordAndNs": 9.720999999999549,
        "slotScanNs": 32.10099999999329,
        "speedup": 3.302232280629028
      },
      {
        "slots": 64,
        "words": 2,
        "wordAndNs": 13.149499999999534,
        "slotScanNs": 68.47100000000864,
        "speedup": 5.207118141375038
      },
      {
        "slots": 128,
        "words": 4,
        "wordAndNs": 15.477499999997233,
        "slotScanNs": 109.92849999999635,
        "speedup": 7.102471329350089
      },
      {
        "slots": 256,
        "words": 8,
        "wordAndNs": 14.498999999996158,
        "slotScanNs": 200.85000000000036,
        "speedup": 13.852679495141292
      },
      {
        "slots": 512,
        "words": 16,
        "wordAndNs": 20.64550000000054,
        "slotScanNs": 404.408000000003,
        "speedup": 19.58819113123889
      },
      {
        "slots": 1024,
        "words": 32,
        "wordAndNs": 33.96049999999377,
        "slotScanNs": 745.8474999999999,
        "speedup": 21.962206092376043
      },
      {
        "slots": 2048,
        "words": 64,
        "wordAndNs": 65.24350000000595,
        "slotScanNs": 1472.9089999999997,
        "speedup": 22.575566914709746
      },
      {
        "slots": 4096,
        "words": 128,
        "wordAndNs": 110.85949999999683,
        "slotScanNs": 2920.3035,
        "speedup": 26.342383828179663
      },
      {
        "slots": 8192,
        "words": 256,
        "wordAndNs": 201.80850000000643,
        "slotScanNs": 5819.213,
        "speedup": 28.835321604391364
      }
    ],
    "widest": {
      "slots": 8192,
      "speedup": 28.835321604391364,
      "nsPerWord": 0.7883144531250251,
      "nsPerSlot": 0.7103531494140625
    }
  },
  "phaseTransition": {
    "config": {
      "courses": 12,
      "sectionsPerCourse": 4,
      "instancesPerPoint": 200,
      "baseSeed": 20260804,
      "poolRange": [
        1,
        55
      ]
    },
    "peak": {
      "meanDensity": 0.10918087121212118,
      "meanNodes": 15222.35,
      "medianNodes": 11474,
      "solvableFraction": 0.195
    },
    "crossover": {
      "meanDensity": 0.09700284090909088,
      "meanNodes": 11884.59,
      "solvableFraction": 0.54
    },
    "easiest": {
      "meanDensity": 0.05172348484848484,
      "meanNodes": 51.495,
      "medianNodes": 17
    },
    "peakOverEasiest": 295.6083114865521,
    "points": [
      {
        "meanDensity": 1,
        "meanNodes": 20,
        "medianNodes": 20,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.5234753787878793,
        "meanNodes": 51.64,
        "medianNodes": 52,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.35901041666666644,
        "meanNodes": 109.86,
        "medianNodes": 116,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.2801657196969697,
        "meanNodes": 215.04,
        "medianNodes": 230,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.23086174242424254,
        "meanNodes": 428.38,
        "medianNodes": 402,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.19531723484848487,
        "meanNodes": 840.74,
        "medianNodes": 794,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.1743513257575758,
        "meanNodes": 1352.36,
        "medianNodes": 1208,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.1573153409090909,
        "meanNodes": 2524.92,
        "medianNodes": 2166,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.14509469696969693,
        "meanNodes": 4117.4,
        "medianNodes": 3144,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.12992897727272723,
        "meanNodes": 7104.64,
        "medianNodes": 5132,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.12435606060606061,
        "meanNodes": 10817.9,
        "medianNodes": 7208,
        "solvableFraction": 0
      },
      {
        "meanDensity": 0.11535984848484854,
        "meanNodes": 15128.4,
        "medianNodes": 10616,
        "solvableFraction": 0.045
      },
      {
        "meanDensity": 0.10918087121212118,
        "meanNodes": 15222.35,
        "medianNodes": 11474,
        "solvableFraction": 0.195
      },
      {
        "meanDensity": 0.10383049242424242,
        "meanNodes": 13311.285,
        "medianNodes": 9054,
        "solvableFraction": 0.34
      },
      {
        "meanDensity": 0.09700284090909088,
        "meanNodes": 11884.59,
        "medianNodes": 5047,
        "solvableFraction": 0.54
      },
      {
        "meanDensity": 0.09358428030303029,
        "meanNodes": 6938.84,
        "medianNodes": 585,
        "solvableFraction": 0.755
      },
      {
        "meanDensity": 0.09146780303030302,
        "meanNodes": 4619.985,
        "medianNodes": 338.5,
        "solvableFraction": 0.805
      },
      {
        "meanDensity": 0.0868986742424243,
        "meanNodes": 2909.675,
        "medianNodes": 104,
        "solvableFraction": 0.885
      },
      {
        "meanDensity": 0.08498579545454549,
        "meanNodes": 2326.775,
        "medianNodes": 86,
        "solvableFraction": 0.945
      },
      {
        "meanDensity": 0.08261837121212118,
        "meanNodes": 1655.55,
        "medianNodes": 70.5,
        "solvableFraction": 0.955
      },
      {
        "meanDensity": 0.07964015151515143,
        "meanNodes": 1518.345,
        "medianNodes": 49.5,
        "solvableFraction": 0.97
      },
      {
        "meanDensity": 0.07805397727272725,
        "meanNodes": 1417.59,
        "medianNodes": 38,
        "solvableFraction": 0.98
      },
      {
        "meanDensity": 0.0755160984848485,
        "meanNodes": 827.11,
        "medianNodes": 42,
        "solvableFraction": 0.99
      },
      {
        "meanDensity": 0.07288352272727269,
        "meanNodes": 520.575,
        "medianNodes": 29,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.07256628787878788,
        "meanNodes": 430.655,
        "medianNodes": 25,
        "solvableFraction": 0.995
      },
      {
        "meanDensity": 0.07170454545454547,
        "meanNodes": 576.99,
        "medianNodes": 23.5,
        "solvableFraction": 0.995
      },
      {
        "meanDensity": 0.0700378787878788,
        "meanNodes": 327.595,
        "medianNodes": 26,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06865530303030302,
        "meanNodes": 351.245,
        "medianNodes": 25,
        "solvableFraction": 0.995
      },
      {
        "meanDensity": 0.06699810606060606,
        "meanNodes": 564.495,
        "medianNodes": 21,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06490530303030304,
        "meanNodes": 160.025,
        "medianNodes": 20.5,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06434185606060602,
        "meanNodes": 68.3,
        "medianNodes": 20,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06337121212121213,
        "meanNodes": 134.6,
        "medianNodes": 19,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06256155303030299,
        "meanNodes": 149.595,
        "medianNodes": 20,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06286458333333335,
        "meanNodes": 108.285,
        "medianNodes": 19,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06360795454545451,
        "meanNodes": 88.825,
        "medianNodes": 20,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06111268939393939,
        "meanNodes": 202.325,
        "medianNodes": 19,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.06042613636363635,
        "meanNodes": 75.83,
        "medianNodes": 19,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.059180871212121205,
        "meanNodes": 179.095,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05847064393939396,
        "meanNodes": 147.58,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05907196969696965,
        "meanNodes": 108.175,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05654829545454544,
        "meanNodes": 103,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.057277462121212104,
        "meanNodes": 91.65,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05642045454545455,
        "meanNodes": 101.58,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05530303030303027,
        "meanNodes": 191.65,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.055198863636363636,
        "meanNodes": 48.05,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.055653409090909094,
        "meanNodes": 113.75,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.054678030303030256,
        "meanNodes": 73.295,
        "medianNodes": 18,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.053929924242424244,
        "meanNodes": 78.555,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.052930871212121214,
        "meanNodes": 170.16,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05248579545454546,
        "meanNodes": 50.63,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05203125,
        "meanNodes": 146.35,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05198390151515151,
        "meanNodes": 122.28,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05084280303030301,
        "meanNodes": 61.86,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.051680871212121164,
        "meanNodes": 101.695,
        "medianNodes": 17,
        "solvableFraction": 1
      },
      {
        "meanDensity": 0.05172348484848484,
        "meanNodes": 51.495,
        "medianNodes": 17,
        "solvableFraction": 1
      }
    ]
  }
} as const;

export type Results = typeof RESULTS;
