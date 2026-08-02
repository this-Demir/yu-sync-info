/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

// Separate config for the experiment suite.
//
// The experiments take minutes and write files into ../docs, so they must not
// run as part of `npm run test`. They are matched only here, by their
// .bench.ts suffix, and are given a long timeout and a single worker so that
// timing measurements are not distorted by parallel test processes competing
// for cores.
export default defineConfig({
  test: {
    include: ['scripts/**/*.bench.ts'],
    testTimeout: 30 * 60 * 1000,
    hookTimeout: 30 * 60 * 1000,
    pool: 'forks',
    maxForks: 1,
    minForks: 1,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
})
