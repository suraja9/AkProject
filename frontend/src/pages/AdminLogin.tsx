import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // We will adjust the endpoint if needed.
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("adminToken", data.token);
                localStorage.setItem("adminEmail", data.email);
                toast({ title: "Success", description: "Logged in successfully." });
                navigate("/admin");
            } else {
                toast({ variant: "destructive", title: "Login Failed", description: data.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "An error occurred during login." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-display text-white mb-2">Admin Login</h1>
                    <p className="text-zinc-400">Sign in to access the control center.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-white"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-white"
                            placeholder="••••••••"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
