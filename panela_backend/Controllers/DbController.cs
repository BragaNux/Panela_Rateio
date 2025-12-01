using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Panela.Api.Data;

namespace Panela.Api.Controllers;

[ApiController]
[Route("api/db")]
[AllowAnonymous]
public class DbController : ControllerBase
{
    private readonly AppDbContext _db;
    public DbController(AppDbContext db){ _db = db; }

    [HttpGet("schema-check")]
    public async Task<ActionResult> SchemaCheck()
    {
        var enabled = Environment.GetEnvironmentVariable("ENABLE_SCHEMA_CHECK");
        if (!string.Equals(enabled, "true", StringComparison.OrdinalIgnoreCase))
            return StatusCode(403, new { message = "schema-check desabilitado" });
        try
        {
            await _db.Database.OpenConnectionAsync();
            using var cmd = _db.Database.GetDbConnection().CreateCommand();
            var checks = new List<(string table, string[] cols)>
            {
                ("Users", new[]{"Id","Email","PasswordHash","Nome","ChavePix","CreatedAt"}),
                ("Groups", new[]{"Id","Nome","Descricao","CreatorId","CreatedAt","Finalizado","FinalizadoEm"}),
                ("Members", new[]{"Id","GroupId","UserId","Status","JoinedAt"}),
                ("Expenses", new[]{"Id","GroupId","PayerId","PagadorNome","Descricao","Amount","Date","CreatedAt"}),
                ("Splits", new[]{"Id","ExpenseId","MemberId","Mode","ShareValue","CreatedAt"}),
                ("FriendRequests", new[]{"Id","RemetenteId","DestinatarioId","Status","CreatedAt","UpdatedAt"}),
                ("Friendships", new[]{"UserId1","UserId2","CreatedAt"}),
                ("Notifications", new[]{"Id","UserId","Type","Message","IsRead","CreatedAt"})
            };
            var result = new List<object>();
            foreach (var (table, cols) in checks)
            {
                cmd.CommandText = "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=@t";
                var p = cmd.CreateParameter();
                p.ParameterName = "@t";
                p.Value = table;
                cmd.Parameters.Clear();
                cmd.Parameters.Add(p);
                var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync()) found.Add(reader.GetString(0));
                var missing = cols.Where(c => !found.Contains(c)).ToArray();
                result.Add(new { table, ok = missing.Length == 0, missing });
            }
            var typesExpected = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["Users"] = new()
                {
                    ["Id"] = "uuid",
                    ["Email"] = "character varying",
                    ["PasswordHash"] = "character varying",
                    ["Nome"] = "character varying",
                    ["ChavePix"] = "character varying",
                    ["CreatedAt"] = "timestamp with time zone"
                },
                ["Groups"] = new()
                {
                    ["Id"] = "uuid",
                    ["Nome"] = "character varying",
                    ["Descricao"] = "text",
                    ["CreatorId"] = "uuid",
                    ["CreatedAt"] = "timestamp with time zone",
                    ["Finalizado"] = "boolean",
                    ["FinalizadoEm"] = "timestamp with time zone"
                },
                ["Members"] = new()
                {
                    ["Id"] = "uuid",
                    ["GroupId"] = "uuid",
                    ["UserId"] = "uuid",
                    ["Status"] = "integer",
                    ["JoinedAt"] = "timestamp with time zone"
                },
                ["Expenses"] = new()
                {
                    ["Id"] = "uuid",
                    ["GroupId"] = "uuid",
                    ["PayerId"] = "uuid",
                    ["PagadorNome"] = "character varying",
                    ["Descricao"] = "character varying",
                    ["Amount"] = "numeric",
                    ["Date"] = "timestamp with time zone",
                    ["CreatedAt"] = "timestamp with time zone"
                },
                ["Splits"] = new()
                {
                    ["Id"] = "uuid",
                    ["ExpenseId"] = "uuid",
                    ["MemberId"] = "uuid",
                    ["Mode"] = "integer",
                    ["ShareValue"] = "numeric",
                    ["CreatedAt"] = "timestamp with time zone"
                },
                ["FriendRequests"] = new()
                {
                    ["Id"] = "uuid",
                    ["RemetenteId"] = "uuid",
                    ["DestinatarioId"] = "uuid",
                    ["Status"] = "character varying",
                    ["CreatedAt"] = "timestamp with time zone",
                    ["UpdatedAt"] = "timestamp with time zone"
                },
                ["Friendships"] = new()
                {
                    ["UserId1"] = "uuid",
                    ["UserId2"] = "uuid",
                    ["CreatedAt"] = "timestamp with time zone"
                },
                ["Notifications"] = new()
                {
                    ["Id"] = "uuid",
                    ["UserId"] = "uuid",
                    ["Type"] = "character varying",
                    ["Message"] = "character varying",
                    ["IsRead"] = "boolean",
                    ["CreatedAt"] = "timestamp with time zone"
                }
            };
            var typeIssues = new List<object>();
            foreach (var kv in typesExpected)
            {
                var table = kv.Key;
                foreach (var ck in kv.Value)
                {
                    cmd.CommandText = "SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=@t AND column_name=@c";
                    var pt = cmd.CreateParameter();
                    pt.ParameterName = "@t";
                    pt.Value = table;
                    var pc = cmd.CreateParameter();
                    pc.ParameterName = "@c";
                    pc.Value = ck.Key;
                    cmd.Parameters.Clear();
                    cmd.Parameters.Add(pt);
                    cmd.Parameters.Add(pc);
                    var dt = string.Empty;
                    using var r2 = await cmd.ExecuteReaderAsync();
                    if (await r2.ReadAsync()) dt = r2.GetString(0);
                    var ok = string.Equals(dt, ck.Value, StringComparison.OrdinalIgnoreCase);
                    if (!ok) typeIssues.Add(new { table, column = ck.Key, expected = ck.Value, actual = dt });
                }
            }
            cmd.CommandText = "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp')";
            cmd.Parameters.Clear();
            var extOk = false;
            using (var rext = await cmd.ExecuteReaderAsync()) { extOk = await rext.ReadAsync(); }
            var defaultsIssues = new List<object>();
            var defaultChecks = new List<(string table,string column,string[] expect)>
            {
                ("Users","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"}),
                ("Groups","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"}),
                ("Members","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"}),
                ("Expenses","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"}),
                ("Splits","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"}),
                ("Notifications","Id", new[]{"uuid_generate_v4()","gen_random_uuid()"})
            };
            foreach (var d in defaultChecks)
            {
                cmd.CommandText = "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=@t AND column_name=@c";
                var pt = cmd.CreateParameter(); pt.ParameterName = "@t"; pt.Value = d.table;
                var pc = cmd.CreateParameter(); pc.ParameterName = "@c"; pc.Value = d.column;
                cmd.Parameters.Clear(); cmd.Parameters.Add(pt); cmd.Parameters.Add(pc);
                var def = string.Empty;
                using var rd = await cmd.ExecuteReaderAsync();
                if (await rd.ReadAsync() && !rd.IsDBNull(0)) def = rd.GetString(0);
                var ok = d.expect.Any(e => (def ?? string.Empty).Contains(e, StringComparison.OrdinalIgnoreCase));
                if (!ok) defaultsIssues.Add(new { table = d.table, column = d.column, expectedAny = d.expect, actual = def });
            }
            var uniqueExpect = new List<(string table,string[] cols)>
            {
                ("Users", new[]{"Email"}),
                ("Members", new[]{"GroupId","UserId"}),
                ("Splits", new[]{"ExpenseId","MemberId"}),
                ("FriendRequests", new[]{"RemetenteId","DestinatarioId"}),
                ("Friendships", new[]{"UserId1","UserId2"})
            };
            var uniqueMissing = new List<object>();
            foreach (var ue in uniqueExpect)
            {
                cmd.CommandText = "SELECT tc.constraint_name FROM information_schema.table_constraints tc WHERE tc.table_schema='public' AND tc.table_name=@t AND tc.constraint_type IN ('UNIQUE','PRIMARY KEY')";
                var pt = cmd.CreateParameter(); pt.ParameterName = "@t"; pt.Value = ue.table;
                cmd.Parameters.Clear(); cmd.Parameters.Add(pt);
                var cons = new List<string>();
                using (var rc = await cmd.ExecuteReaderAsync())
                {
                    while (await rc.ReadAsync()) cons.Add(rc.GetString(0));
                }
                var ok = false;
                foreach (var cn in cons)
                {
                    cmd.CommandText = "SELECT column_name FROM information_schema.key_column_usage WHERE table_schema='public' AND table_name=@t AND constraint_name=@n ORDER BY ordinal_position";
                    var pn = cmd.CreateParameter(); pn.ParameterName = "@n"; pn.Value = cn;
                    cmd.Parameters.Clear(); cmd.Parameters.Add(pt); cmd.Parameters.Add(pn);
                    var cols = new List<string>();
                    using var rk = await cmd.ExecuteReaderAsync();
                    while (await rk.ReadAsync()) cols.Add(rk.GetString(0));
                    if (cols.SequenceEqual(ue.cols)) { ok = true; break; }
                }
                if (!ok) uniqueMissing.Add(new { table = ue.table, columns = ue.cols });
            }
            var fkExpect = new List<(string table,string col,string refTable,string refCol,string[] deleteRules)>
            {
                ("Groups","CreatorId","Users","Id", new[]{"RESTRICT","NO ACTION"}),
                ("Members","GroupId","Groups","Id", new[]{"CASCADE"}),
                ("Members","UserId","Users","Id", new[]{"CASCADE"}),
                ("Expenses","GroupId","Groups","Id", new[]{"CASCADE"}),
                ("Expenses","PayerId","Users","Id", new[]{"RESTRICT","NO ACTION"}),
                ("Splits","ExpenseId","Expenses","Id", new[]{"CASCADE"}),
                ("Splits","MemberId","Members","Id", new[]{"CASCADE"}),
                ("FriendRequests","RemetenteId","Users","Id", new[]{"CASCADE"}),
                ("FriendRequests","DestinatarioId","Users","Id", new[]{"CASCADE"}),
                ("Friendships","UserId1","Users","Id", new[]{"CASCADE"}),
                ("Friendships","UserId2","Users","Id", new[]{"CASCADE"})
            };
            var fkIssues = new List<object>();
            foreach (var fe in fkExpect)
            {
                cmd.CommandText = @"SELECT kcu.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.table_schema='public' AND kcu.table_name=@t AND kcu.column_name=@c";
                var pt = cmd.CreateParameter(); pt.ParameterName = "@t"; pt.Value = fe.table;
                var pc = cmd.CreateParameter(); pc.ParameterName = "@c"; pc.Value = fe.col;
                cmd.Parameters.Clear(); cmd.Parameters.Add(pt); cmd.Parameters.Add(pc);
                var ok = false; string dr = "";
                using var rf = await cmd.ExecuteReaderAsync();
                if (await rf.ReadAsync())
                {
                    var rt = rf.GetString(2);
                    var rc = rf.GetString(3);
                    dr = rf.GetString(4);
                    ok = string.Equals(rt, fe.refTable, StringComparison.OrdinalIgnoreCase) && string.Equals(rc, fe.refCol, StringComparison.OrdinalIgnoreCase) && fe.deleteRules.Contains(dr);
                }
                if (!ok) fkIssues.Add(new { table = fe.table, column = fe.col, expectedRef = fe.refTable+"."+fe.refCol, expectedDeleteRuleAny = fe.deleteRules, actualDeleteRule = dr });
            }
            cmd.CommandText = "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='FriendRequests'";
            cmd.Parameters.Clear();
            var frIdxOk = false;
            using (var rix = await cmd.ExecuteReaderAsync())
            {
                while (await rix.ReadAsync())
                {
                    var def = rix.GetString(1);
                    if (def.Contains("(\"Status\")", StringComparison.Ordinal)) { frIdxOk = true; break; }
                }
            }
            var status = fkIssues.Count==0 && uniqueMissing.Count==0 && typeIssues.Count==0 && extOk;
            return Ok(new { status = status ? "ok" : "issues", checks = result, issues = new { types = typeIssues, defaults = defaultsIssues, uniques = uniqueMissing, fks = fkIssues, extensions = extOk, friendRequestsStatusIndex = frIdxOk } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
        finally
        {
            await _db.Database.CloseConnectionAsync();
        }
    }
}
