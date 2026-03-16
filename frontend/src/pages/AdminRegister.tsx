import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AdminPageLayout } from "@/components/AdminPageLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
    _id: string;
    name?: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function AdminRegister() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Admin");
    const [loading, setLoading] = useState(false);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const { toast } = useToast();

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admins`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("adminToken");
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, role, password }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({ title: "Success", description: "Admin registered successfully." });
                setName("");
                setEmail("");
                setPassword("");
                setRole("Admin");
                fetchAdmins(); // Refresh the list
            } else {
                toast({ variant: "destructive", title: "Registration Failed", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred during registration." });
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (adminRole: string) => {
        switch (adminRole) {
            case "Super Admin": return <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">{adminRole}</Badge>;
            case "Admin": return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{adminRole}</Badge>;
            case "Viewer": return <Badge className="bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20">{adminRole}</Badge>;
            default: return <Badge variant="outline">{adminRole}</Badge>;
        }
    };

    return (
        <AdminPageLayout title="Admin Management" description="Register new admins and view existing users.">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-8 mt-6">

                {/* Registration Form */}
                <Card className="bg-card border-border shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle>Register User</CardTitle>
                        <CardDescription>Add a new staff member</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="newadmin@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Temporary Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2" disabled={loading}>
                                {loading ? "Registering..." : "Create Account"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Admins List */}
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle>Registered Users</CardTitle>
                        <CardDescription>A list of all users with access to this panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                Loading admins...
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        admins.map((admin) => (
                                            <TableRow key={admin._id}>
                                                <TableCell className="font-medium">{admin.name || "System Admin"}</TableCell>
                                                <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                                                <TableCell>{getRoleBadge(admin.role)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(admin.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminPageLayout>
    );
}
