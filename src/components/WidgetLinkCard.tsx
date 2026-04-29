import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WidgetLinkCardProps {
  title: string;
  description: string;
  url: string;
  label?: string;
}

export default function WidgetLinkCard({ title, description, url, label = "OBS Widget URL" }: WidgetLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy widget URL:", error);
    }
  };

  return (
    <Card className='border-[#C98958]/20 bg-black/25 text-white shadow-lg shadow-black/30'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-2'>
            <p className='text-xs uppercase tracking-[0.3em] text-white/45'>{label}</p>
            <h3 className='text-lg font-bold text-white'>{title}</h3>
            <p className='text-sm text-white/50'>{description}</p>
          </div>

          <Button type='button' onClick={copyUrl} className='bg-[#C98958] text-white hover:bg-[#930203]'>
            {copied ? "Copied" : "Copy URL"}
          </Button>
        </div>

        <div className='mt-4 rounded-2xl border border-[#C98958]/15 bg-[#120b0a]/80 px-4 py-3'>
          <p className='break-all text-sm text-[#E7AC78]'>{url}</p>
        </div>
      </CardContent>
    </Card>
  );
}