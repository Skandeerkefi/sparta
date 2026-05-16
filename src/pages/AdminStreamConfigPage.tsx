import { useEffect, useState } from "react";
import GraphicalBackground from "@/components/GraphicalBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import streamConfigApi from "@/lib/streamConfigApi";

const toDateTimeLocal = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function AdminStreamConfigPage() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [nextStreamAt, setNextStreamAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await streamConfigApi.getPublicStreamConfig();
        setNextStreamAt(toDateTimeLocal(data.nextStreamAt));
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load stream configuration", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      load();
    }
  }, [isAdmin, toast]);

  const handleSave = async () => {
    if (!token || !nextStreamAt) return;

    setSaving(true);
    try {
      await streamConfigApi.updateStreamConfig(new Date(nextStreamAt).toISOString(), token);
      toast({ title: "Saved", description: "Next stream date and time updated." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save stream configuration", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className='min-h-screen bg-[#0F0604]'>
        <GraphicalBackground />
        <Navbar />
        <div className='container relative z-10 px-4 py-8 mx-auto'>
          <div className='text-center'>
            <h1 className='mb-4 text-2xl font-bold text-white'>Access Denied</h1>
            <p className='text-gray-300'>You need admin privileges to access this page.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='relative flex flex-col min-h-screen text-white'>
      <GraphicalBackground />
      <Navbar />
      <main className='relative z-10 flex-grow w-full max-w-3xl px-4 py-8 mx-auto sm:px-6 lg:px-8'>
        <h1 className='text-2xl font-bold'>Stream Schedule (Admin)</h1>
        <p className='mt-2 text-sm text-white/65'>Set the next stream time shown on the home page countdown.</p>

        <div className='mt-6 rounded-2xl border border-[#C98958]/25 bg-black/40 p-5'>
          <label className='block mb-2 text-sm text-white/70'>Next stream date and time</label>
          <Input
            type='datetime-local'
            value={nextStreamAt}
            onChange={(event) => setNextStreamAt(event.target.value)}
            className='border-[#C98958]/25 bg-black/40 text-white'
          />
          <Button className='mt-4 bg-[#C98958] text-white hover:bg-[#930203]' onClick={handleSave} disabled={saving || loading || !nextStreamAt}>
            {saving ? "Saving..." : "Save Next Stream"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
