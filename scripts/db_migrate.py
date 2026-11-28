"""Copy PostgreSQL to an empty target, with a private backup and row verification.

python scripts/db_migrate.py inspect --source .env --target .private/neon.env
python scripts/db_migrate.py copy --source .env --target .private/neon.env
Refuses a populated target unless --replace-public is explicitly supplied.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
from datetime import datetime, timezone

import psycopg
from psycopg import sql


def read_env(path):
    return {key.strip(): value.strip().strip("\"'") for line in Path(path).read_text(encoding="utf-8-sig").splitlines()
            if line.strip() and not line.lstrip().startswith("#") and "=" in line
            for key, value in [line.split("=", 1)]}


def connection_settings(path):
    env = read_env(path)
    return dict(host=env.get("PGHOST", env.get("POSTGRES_HOST", "127.0.0.1")),
                port=env.get("PGPORT", "5432") if env.get("PGHOST") else env.get("POSTGRES_PORT", env.get("PHARMACY_EXTERNAL_DB_PORT", "5432")),
                dbname=env.get("PGDATABASE", env.get("POSTGRES_DB", "pharmacy")),
                user=env.get("PGUSER", env.get("POSTGRES_USER", "pharmacy")),
                password=env.get("PGPASSWORD", env.get("POSTGRES_PASSWORD", "")),
                sslmode=env.get("PGSSLMODE", "prefer"),
                channel_binding=env.get("PGCHANNELBINDING", "prefer"), connect_timeout=20)


def snapshot(config):
    with psycopg.connect(**config) as conn:
        conn.execute("SET TIME ZONE 'UTC'")
        tables = [r[0] for r in conn.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")]
        counts, hashes = {}, {}
        for table in tables:
            counts[table] = conn.execute(sql.SQL("SELECT count(*) FROM {}").format(sql.Identifier(table))).fetchone()[0]
            digest = hashlib.sha256()
            # Stable across row order; includes passwords, IDs, relations and session values without printing them.
            rows = conn.execute(sql.SQL("SELECT row_to_json(t)::text FROM {} t ORDER BY row_to_json(t)::text").format(sql.Identifier(table)))
            for (row,) in rows:
                digest.update(row.encode())
            hashes[table] = digest.hexdigest()
        return {"tables": counts, "hashes": hashes}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["inspect", "copy", "verify"])
    parser.add_argument("--source", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--replace-public", action="store_true", help="Explicitly replace an existing public schema after backing it up")
    args = parser.parse_args()
    source, target = connection_settings(args.source), connection_settings(args.target)
    before, destination = snapshot(source), snapshot(target)
    print(json.dumps({"source": {k: v for k, v in source.items() if k in ("host", "port", "dbname")},
                      "source_tables": before["tables"], "target_tables": destination["tables"]}, indent=2))
    if args.action == "inspect":
        return
    if args.action == "verify":
        if before != destination:
            print("Different tables:", [name for name in before["hashes"] if before["hashes"][name] != destination["hashes"].get(name)])
            raise SystemExit("Verification failed.")
        Path(".private/database-migration/neon-verification.json").write_text(json.dumps({"verified_at": datetime.now(timezone.utc).isoformat(), **destination}, indent=2), encoding="utf-8")
        print("Verified every table by count and content hash.")
        return
    if destination["tables"] and not args.replace_public:
        raise SystemExit("Target is not empty. No changes made; choose an empty Neon branch/database.")
    backup_dir = Path(".private/database-migration") / datetime.now(timezone.utc).strftime("neon-%Y%m%dT%H%M%SZ")
    backup_dir.mkdir(parents=True)
    backup = backup_dir / "source.dump"
    pg_bin = Path(os.environ.get("PG_BIN", r"C:\Program Files\PostgreSQL\17\bin"))

    def run(program, config, *options, capture=False):
        executable = str(pg_bin / (program + ".exe")) if os.environ.get("PG_BIN") else shutil.which(program) or str(pg_bin / (program + ".exe"))
        env = os.environ.copy()
        env.update({"PG" + k.upper(): str(v) for k, v in config.items() if k != "connect_timeout"})
        # libpq spells these settings differently from psycopg keyword names.
        env["PGDATABASE"] = config["dbname"]
        env["PGCHANNELBINDING"] = config["channel_binding"]
        subprocess.run([executable, *options], env=env, check=True, stdout=subprocess.DEVNULL if capture else None)

    if destination["tables"]:
        target_backup = backup_dir / "neon-before.dump"
        run("pg_dump", target, "--format=custom", "--schema=public", "--no-owner", "--no-acl", "--file", str(target_backup))
        run("pg_restore", target, "--list", str(target_backup), capture=True)
    run("pg_dump", source, "--format=custom", "--schema=public", "--no-owner", "--no-acl", "--file", str(backup))
    run("pg_restore", source, "--list", str(backup), capture=True)
    # Single transaction ensures an import failure does not leave a partial schema.
    clean = ["--clean", "--if-exists"] if destination["tables"] else []
    run("pg_restore", target, "--single-transaction", "--exit-on-error", "--no-owner", "--no-acl", *clean, "--dbname", target["dbname"], str(backup))
    after, source_after = snapshot(target), snapshot(source)
    if before != source_after:
        raise SystemExit("Source changed during copy. Do not switch traffic; pause writes and repeat into an empty target.")
    if before != after:
        raise SystemExit("Verification failed. Do not switch traffic; inspect the backup and target.")
    report = {"verified_at": datetime.now(timezone.utc).isoformat(), "backup": str(backup),
              "backup_sha256": hashlib.sha256(backup.read_bytes()).hexdigest(), **after}
    (backup_dir / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Verified all {len(after['tables'])} tables by row count and content hash. Backup: {backup}")


if __name__ == "__main__":
    main()
