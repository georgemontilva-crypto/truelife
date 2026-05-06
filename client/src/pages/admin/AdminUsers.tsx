import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, Shield, User } from "lucide-react";

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const users = trpc.admin.users.list.useQuery();

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => { utils.admin.users.list.invalidate(); toast.success("User role updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.data?.length ?? 0} registered users</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {users.isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : users.data && users.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-left">
                  {["User", "Email", "Login Method", "Joined", "Role", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          {u.role === "admin" ? <Shield className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-blue-400" />}
                        </div>
                        <span className="font-medium text-gray-900">{u.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{u.email ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-500 capitalize">{u.loginMethod ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as "user" | "admin" })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No users yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
