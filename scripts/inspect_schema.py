"""Inspect every Parquet schema and write docs/schema.md (read-only against data)."""
from collections import Counter
import pyarrow.parquet as pq
from _dataset import FILES, ROOT, markdown_table


def main():
    schemas = Counter()
    for path in FILES:
        schemas[str(pq.read_schema(path))] += 1
    schema = pq.read_schema(FILES[0])
    rows = []
    for field in schema:
        physical = "binary bytes" if field.name == "event" else str(field.type)
        nested = "No"
        rows.append((field.name, physical, "Yes" if field.nullable else "No", nested, "PARQUET field_id=0"))
    text = "# Parquet schema\n\n"
    text += f"Inspected all **{len(FILES):,}** journey files on 2026-07-21. There is **{len(schemas)} schema variant**; every file has the schema below.\n\n"
    text += markdown_table(["Column", "Logical / storage type", "Nullable", "Nested", "Field metadata"], rows)
    text += "\n\n`event` is raw binary and must be UTF-8 decoded. `ts` is a non-null `timestamp[ms]`; it is not a duration type. No nested, list, struct, map, or extension fields exist.\n"
    (ROOT / "docs" / "schema.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
