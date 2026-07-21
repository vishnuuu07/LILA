# Data Quality Report

## Missing values

- No missing values were found in the inspected rows.

## Duplicates

- 1,420 duplicated rows were observed across the corpus.
- These should be investigated before downstream preprocessing to avoid double-counting in derived statistics.

## Invalid coordinates

- No invalid coordinate values were found in the rows inspected.

## Outliers

- The coordinate ranges are plausible for the provided maps and metadata.
- The movement update frequency varies widely by file, which is expected because some files contain many samples and others few.

## Corrupt rows

- No corrupt parquet files were encountered in the inspected sample set.

## Unexpected values

- `Kill` and `Killed` are extremely sparse compared with other events.
- This could reflect data sparsity, event taxonomy differences, or a limited subset of the full dataset.

## Encoding issues

- The `event` bytes field must be decoded from binary to text.
- This is a known and expected preprocessing step.

## Handling recommendations

1. Decode the `event` column to text during preprocessing.
2. Deduplicate rows before building aggregates.
3. Treat `Position` and `BotPosition` as the primary movement samples.
4. Keep `x`/`z` projection logic in preprocessing rather than in the frontend.
5. Treat match-level durations cautiously because the dataset appears to be per-player/per-match snapshots rather than full match timelines.
